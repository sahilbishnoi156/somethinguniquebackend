const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetcher');
const sendOtp = require('../utils/mailer.js');
const Otp = require('../models/Otp');
const College = require('../models/College');
const Club = require('../models/Club');

const JWT_SECRET = process.env.JWT_SECRET;

const isDev = process.env.NODE_ENV !== "production";


// ROUTE 1: Create a User using: POST "/api/auth/createuser". No login required
router.post(
    '/create-user',
    [
        body('username', 'Enter a valid username').isLength({
            min: 3,
        }),
        body('college_id', 'Enter a valid college_id'),
        body('email', 'Enter a valid email').isEmail(),
    ],
    async (req, res) => {
        // If there are errors, return Bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                data: errors.array(),
                message: 'Invalid data',
            });
        }
        try {
            // Check whether the user with this email exists already

            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({
                    message:
                        'Sorry a user with this email already exists',
                    data: null,
                });
            }

            const college = await College.findById(
                req.body.college_id
            );
            if (!college) {
                return res.status(400).json({
                    message: 'Invalid college',
                    data: null,
                });
            }

            // Create a new user
            user = await User.create({
                username: req.body.username,
                email: req.body.email,
                college_id: req.body.college_id,
                avatar: req.body.avatar,
            });

            const data = {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    college_id: user.college_id,
                    role: user.role,
                },
            };
            const authToken = jwt.sign(data, JWT_SECRET);
            res.json({
                data: { authToken },
                message: 'User created successfully',
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                data: error,
                message: 'Internal Server Error',
            });
        }
    }
);

// ROUTE 3: Get logged in User Details using: POST "/api/auth/getuser". Login required
router.get('/get-user', fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            '-password'
        );
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/check-username-availability', async (req, res) => {
    try {
        const username = req.query.username;
        if (!username || username.length < 3) {
            return res.status(400).json({
                data: false,
                message: 'Invalid username length',
            });
        }
        const user = await User.findOne({
            username,
        });
        if (user) {
            return res.status(400).json({
                data: false,
                message: 'Username already taken',
            });
        }
        res.status(200).json({
            data: true,
            message: 'Username available',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/send-otp", async (req, res) => {
  try {
    const { email, type } = req.query;

    // ✅ Validate type
    if (!["login", "register"].includes(type)) {
      return res.status(400).json({
        data: null,
        message: "Invalid request type.",
        meta: { status: 400 },
      });
    }

    // ✅ Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        data: null,
        message: "Please enter a valid email address.",
        meta: { status: 400 },
      });
    }

    // ✅ For login → ensure user exists
    if (type === "login") {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          data: null,
          message: "User not found. Please sign up.",
          meta: { status: 404 },
        });
      }
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // ✅ Save OTP
    await Otp.findOneAndUpdate(
      { email },
      { otp, expireAt: otpExpiry },
      { upsert: true, new: true }
    ).catch((err) => {
      console.error("Database error:", err);
      throw new Error("Failed to save OTP.");
    });

    // ✅ Respond to client immediately
    res.status(200).json({
      data: null,
      message: "OTP generated successfully. Check your email shortly.",
      meta: { status: 200 },
    });

    // ✅ Send email in background (don’t await)
    sendOtp(email, otp)
      .then((result) => {
        if (!result.success) {
          console.error(`❌ OTP email failed for ${email}:`, result.message);
        } else if (isDev) {
          console.log(`📧 OTP email sent to ${email}:`, result.info?.messageId);
        }
      })
      .catch((err) => {
        console.error(`❌ Unexpected email error for ${email}:`, err.message);
      });
  } catch (error) {
    console.error("Error in /send-otp:", error);
    return res.status(500).json({
      data: null,
      message: "Error sending OTP. Please try again later.",
      ...(isDev && { debug: error.message }),
      meta: { status: 500 },
    });
  }
});


router.get('/get-colleges', async (req, res) => {
    try {
        const colleges = await College.find();
        res.status(200).json({
            data: colleges,
            message: 'Colleges fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: error,
            message:
                'Error fetching colleges. Please try again later.',
        });
    }
});

router.get('/get-college-club', fetchuser, async (req, res) => {
    try {
        const college = await College.findById(req?.user?.college_id);
        const club = await Club.findOne({ admin: req?.user?.id });
        if (!college) {
            return res.status(400).json({
                data: null,
                message: 'College not found',
            });
        }
        res.status(200).json({
            data: {
                college,
                club,
            },
            message: 'College fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: error,
            message:
                'Error fetching college. Please try again later.',
        });
    }
});

router.post('/add-club', fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(400).json({
                data: null,
                message: 'User not found',
            });
        }
        const college = await College.findById(user.college_id);
        if (!college) {
            return res.status(400).json({
                message: 'Invalid college',
                data: null,
            });
        }
        const { name, description, college_id } = req.body;
        const club = await Club.create({
            name,
            description,
            college_id: college._id,
            admin: user._id,
        });
        res.status(200).json({
            data: club,
            message: 'Club added successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: error,
            message: 'Internal Server Error',
        });
    }
});

router.post('/verify-otp', async (req, res) => {
    //changed to POST for security
    try {
        const { email, otp } = req.body; //Use req.body for POST requests; safer than query params
        const type = req.query.type;
        if (type !== 'login' && type !== 'register') {
            return res.status(400).json({
                data: null,
                message: 'Invalid request type.',
                meta: { status: 400 },
            });
        }
        // Input validation
        if (!email || !otp) {
            return res.status(400).json({
                data: null,
                message: 'Please enter both email and OTP.',
            });
        }

        const user = await User.findOne({ email }).populate(
            'college_id'
        );
        if (!user && type === 'login') {
            return res.status(400).json({
                data: null,
                message: 'User not found. Please sign up.',
            });
        }

        const otpData = await Otp.findOne({ email, otp });
        if (!otpData) {
            return res.status(400).json({
                data: null,
                message: 'Invalid OTP. Please try again.',
            });
        }

        if (otpData.expireAt < new Date()) {
            return res.status(400).json({
                data: null,
                message: 'OTP is expired',
            });
        }

        // Generate JWT (Consider using a library for more robust JWT handling)
        const authToken = jwt.sign(
            {
                user: {
                    email: email,
                    id: user ? user.id : null,
                    username: user ? user.username : null,
                    college_id: user ? user.college_id._id : null,
                    role: user ? user.role : null,
                },
            },
            process.env.JWT_SECRET,
            {
                expiresIn: type === 'register' ? '1h' : '2d',
            }
        ); //add expiry time

        //  Consider deleting the OTP entry after successful verification for enhanced security
        await Otp.deleteOne({ email, otp });

        res.status(200).json({
            data: { authToken }, //Return just the token
            message: 'OTP verified successfully.',
        });
    } catch (error) {
        console.error('Error verifying OTP:', error.message);
        res.status(500).json({
            data: error,
            message: 'Error verifying OTP. Please try again later.',
        });
    }
});

router.delete('/delete-user', fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(400).json({
                data: null,
                message: 'User not found',
            });
        }

        await Post.deleteMany({ user_id: req.user.id });
        await Comment.deleteMany({ user_id: req.user.id });
        await Vote.deleteMany({ user_id: req.user.id });

        await User.deleteOne({
            _id: req.user.id,
        });
        res.status(200).json({
            data: null,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: error,
            message: 'Internal Server Error',
        });
    }
});

module.exports = router;
