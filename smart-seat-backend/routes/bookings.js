const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/', bookingController.getAllBookings);
router.get('/getBookedSeats', bookingController.getBookedSeats);
router.post('/update-expired', bookingController.updateExpiredBookings);
router.get('/:id', bookingController.getBookingById);
router.post('/', bookingController.createbooking);
router.put('/:id', bookingController.updatebooking);
router.patch('/:id', bookingController.updatebooking);
router.delete('/:id', bookingController.deletebooking);
router.put('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
    