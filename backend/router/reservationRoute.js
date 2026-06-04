const express = require("express");
const router = express.Router();

const reservationController =require("../controllers/reservationController");
const verifyToken = require("../middleware/authicantejwt");
  //all unavailability page routs
  router.post('/unavailability',verifyToken, reservationController.createUnavailability);
  router.get('/unavailability',verifyToken, reservationController.getUnavailability);
  router.get('/unavailability/:id',reservationController.getUnavailabilitybyid)
  router.put('/unavailability/:id', reservationController.updateUnavailability);
  router.delete('/unavailability/:id',reservationController.deleteUnavailability);
  // get reservation data
  router.get('/reservation',verifyToken, reservationController.getReservations)
  // delete reservation
  router.delete('/reservation/:id',reservationController.deleteReservation)
  router.get('/tableunbookbyid/:tableid', reservationController.getTableByIdreservation)
  router.get("/reservation/:id",reservationController.getReservationById);
  router.put("/reservationbook/:reserveid",reservationController.updateReservationAndCustomer);
  // create reservation
  router.post("/reservationbook",verifyToken, reservationController.createReservation);
 
  // get all free table for booking
  router.get('/getavailablereservationtables',verifyToken, reservationController.getavailablereservationtables)

  // Reservation setting
  router.put('/setting/:id', reservationController.updatereservationsetting);

module.exports =router