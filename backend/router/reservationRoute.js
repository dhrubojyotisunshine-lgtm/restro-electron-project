const express = require("express");
const router = express.Router();

const reservationController =require("../controllers/reservationController");
const verifyToken = require("../middleware/authicantejwt");
  //all unavailability page routs
  router.post('/unavailability',verifyToken, reservationController.createUnavailability);
  router.get('/unavailability',verifyToken, reservationController.getUnavailability);
  router.get('/unavailability/:id',verifyToken, reservationController.getUnavailabilitybyid)
  router.put('/unavailability/:id', verifyToken, reservationController.updateUnavailability);
  router.delete('/unavailability/:id',verifyToken, reservationController.deleteUnavailability);
  // get reservation data
  router.get('/reservation',verifyToken, reservationController.getReservations)
  // delete reservation
  router.delete('/reservation/:id',verifyToken, reservationController.deleteReservation)
  router.get('/tableunbookbyid/:tableid', verifyToken, reservationController.getTableByIdreservation)
  router.get("/reservation/:id",verifyToken, reservationController.getReservationById);
  router.put("/reservationbook/:reserveid",verifyToken, reservationController.updateReservationAndCustomer);
  // create reservation
  router.post("/reservationbook",verifyToken, reservationController.createReservation);

  // get all free table for booking
  router.get('/getavailablereservationtables',verifyToken, reservationController.getavailablereservationtables)

  // Reservation setting
  router.put('/setting/:id', verifyToken, reservationController.updatereservationsetting);

module.exports =router
