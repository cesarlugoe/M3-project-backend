const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const User = require('../models/user');
const Game = require('../models/game');
const Mission = require('../models/mission');
const helpers= require('../helpers/helpers');




/* ------------- Game Join ----------------*/
router.post('/join', (req, res, next) => {
  const { mission, roomName }  = req.body;
  const userId = req.session.currentUser._id;
  if(!mission || !roomName) {
    return res.status(422).json(
      {
      error: 'empty field'
    })
  }

  Game.findOne({roomName: roomName})
    .then(game => {
      const isInArray = game.participants.some(participant => {
        return participant.equals(userId);
        })
        if(!isInArray) {
          game.participants.push(ObjectId(userId))
          game.missions.push({ mission, target:'', killer:'' })
          game.save()
          .then(() => {
            res.status(200).json(game);
      })
      .catch(next);
      }
    })
    .catch(next)
})

/* ------------ Game Detail --------------*/
router.get('/:_id', (req, res, next) => {
  const gameId = req.params._id;
Game.findById(gameId)
  .populate('admin')
  .populate('participants')
  .then((game) => {
    
    res.status(200).json(game);
  })
  .catch(next);
})

/* ------------ Create new Game --------------*/
router.post('/', (req, res, next) => {
  const { roomName, mission } = req.body;
  const adminId = req.session.currentUser._id;
  let target = '';
  let killer = '';
  

  if(!roomName) {
    return res.status(422).json(
      {
      error: 'empty field'
    })
  }

  // const newMission = new Mission ({
  //   killer:{},
  //   target:{},
  //   mission: mission,
  // })

  const newGame = new Game({ 
    roomName,
    missions: {mission: mission},
    admin: ObjectId(adminId),
    participants: [ObjectId(adminId)],
  });
  newGame.save()
  .then(() => {
    res.status(200).json(newGame);
  })
  .catch(next);  
});

/* ------------ Start Game --------------*/
router.get('/:_id/start', (req, res, next) => {
  const gameId = req.params._id;
  Game.findById(gameId)
  .populate('admin')
  .populate('participants')
  .lean()
  .then(game => {
    const { missions, participants } = game;
    const sortedMissions = helpers.sortGame(missions, participants);
    game.missions = sortedMissions;
    Game.updateOne({_id: gameId}, game)
      .then((game) => {
        game._id = gameId
        res.status(200).json(game);
      })
    .catch(next); 
  })
  .catch(next);
});

/* ------------- Kill user ----------------*/ 
router.post('/:_id/kill', (req, res, next) => {
  const gameId = req.params._id;
  const userId = req.session.currentUser._id;
  Game.findById(gameId)
  .populate('admin')
  .populate('participants')
  .then(game => {
    const { missions, participants } = game;
    const userMissionIndex = missions.findIndex(mission => {
      return mission.killer.toString() === userId;
    });
    const targetId = missions[userMissionIndex].target;
    const newMissionIndex = missions.findIndex(mission => {
      return mission.killer.toString() === targetId.toString();
        });
     missions[newMissionIndex].killer = userId;
     missions.splice(userMissionIndex, 1);
      game.save()
      .then(() => {
        res.status(200).json(game);
      })
      .catch(next); 
     })
  })
module.exports = router;