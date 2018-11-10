const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const User = require('../models/user');
const Game = require('../models/game');
const Mission = require('../models/game');




/* ------------- Game Join ----------------*/
/*- POST game/:id/join 
  UserID, joinInfo 
  $ Required fields $ (QR || code), (mission || randomM)
  Game.db.find(gameCode)
    game.participant.push(UserID)
    game.mission.push(mission)
    game.save()
      res.status(200) {game data} */


router.post('/join', (req, res, next) => {
  const { mission, roomName }  = req.body;
  const userId = req.session.currentUser._id;
  console.log("hola");



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
          game.missions.push({ mission: mission })
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
  const { roomName } = req.body;
  const adminId = req.session.currentUser._id;
  

  if(!roomName) {
    return res.status(422).json(
      {
      error: 'empty field'
    })
  }

  const newGame = new Game({ 
    roomName,
    admin: ObjectId(adminId),
    participants: [ObjectId(adminId)],
  });
  newGame.save()
  .then(() => {
    res.status(200).json(newGame);
  })
  .catch(next);  
});



module.exports = router;