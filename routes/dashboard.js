const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const router = express.Router();
const College = require('../models/College');
const Club = require('../models/Club');
const isSuperAdmin = require('../middleware/isSuperAdmin');
const isCollegeAdmin = require('../middleware/isCollegeAdmin');
const fetchuser = require('../middleware/fetcher');

const getDashboardData = async (Model, tab) => {
    const data = await Model.find();
    const total = await Model.countDocuments();
    return {
        tab,
        data: {
            data,
            total,
        },
    };
};

// API route for fetching dashboard data
router.get('/superadmin', isSuperAdmin, async (req, res) => {
    const { tab } = req.query;

    try {
        let result;

        switch (tab) {
            case 'admins':
                const data = await User.find({
                    role: {
                        $in: [
                            'super_admin',
                            'college_admin',
                            'student',
                        ],
                    },
                });
                const totalSuperAdmins = await User.countDocuments({
                    role: 'super_admin',
                });

                const totalCollegeAdmins = await User.countDocuments({
                    role: 'college_admin',
                });

                const totalStudents = await User.countDocuments({
                    role: 'student',
                });
                result = {
                    tab: 'admins',
                    data: {
                        data,
                        totalSuperAdmins,
                        totalCollegeAdmins,
                        totalStudents,
                    },
                };
                break;
            case 'colleges':
                result = await getDashboardData(College, 'colleges');
                break;
            case 'clubs':
                const clubData = await Club.find()
                    .populate('admin')
                    .populate('college_id');
                const total = await Club.countDocuments();
                const inactiveClubs = await Club.countDocuments({
                    status: {
                        $in: ['inactive', 'review'],
                    },
                });
                result = {
                    tab,
                    data: {
                        data: clubData,
                        total,
                        activeClubs: total - inactiveClubs,
                        inactiveClubs,
                    },
                };
                break;
            default:
                return res
                    .status(400)
                    .json({ error: 'Invalid tab specified' });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to Load Dashboard Data.',
        });
    }
});
router.get('/collegeadmin', isCollegeAdmin, async (req, res) => {
    const { tab } = req.query;
    try {
        let result;

        switch (tab) {
            case 'students':
                const data = await User.find({
                    college_id: req?.user?.college_id,
                });
                result = {
                    tab: 'students',
                    data: {
                        data,
                        totalStudents: data.length,
                    },
                };
                break;
            case 'clubs':
                const clubData = await Club.find({
                    college_id: req?.user?.college_id,
                })
                    .populate('admin')
                    .populate('college_id');
                const total = await Club.countDocuments({
                    college_id: req?.user?.college_id,
                });
                const inactiveClubs = await Club.countDocuments({
                    status: {
                        $in: ['inactive', 'review'],
                    },
                    college_id: req?.user?.college_id,
                });
                result = {
                    tab,
                    data: {
                        data: clubData.map((club) => ({
                            ...club._doc,
                            actionAuthorized: true,
                        })),
                        total,
                        activeClubs: total - inactiveClubs,
                        inactiveClubs,
                    },
                };
                break;
            default:
                return res
                    .status(400)
                    .json({ error: 'Invalid tab specified' });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to Load Dashboard Data.',
        });
    }
});
router.patch('/approve-club', isCollegeAdmin, async (req, res) => {
    const { clubId } = req.body;
    try {
        const club = await Club.findByIdAndUpdate(clubId, {
            status: 'active',
        });
        if (!club) {
            return res.status(404).json({
                message: 'Club not found',
            });
        }
        res.json({
            message: 'Club approved successfully',
            data: club,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to approve Club.',
        });
    }
});
router.get('/get-college', fetchuser, async (req, res) => {
    const { college_id } = req.query;
    try {
        const college = await College.findById(
            college_id || req?.user?.college_id
        );
        if (!college) {
            return res.status(404).json({
                message: 'College not found',
            });
        }
        res.json({
            message: 'College fetched successfully',
            data: college,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to fetch college.',
        });
    }
});
router.post('/add-college', isSuperAdmin, async (req, res) => {
    const { name, city, state, country } = req.body;

    let newName = name;
    if (city) {
        newName += ', ' + city;
    }
    if (state) {
        newName += ', ' + state;
    }
    if (country) {
        newName += ', ' + country;
    }
    try {
        const college = new College({
            name: newName,
            city,
            state,
            country,
        });

        await college.save();
        res.json({
            message: 'College added successfully',
            data: college,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to Add College.',
        });
    }
});
router.delete('/remove-college', isSuperAdmin, async (req, res) => {
    const { id } = req.query;
    try {
        const college = await College.findByIdAndDelete(id);
        res.json({
            message: 'College removed successfully',
            data: college,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to remove College.',
        });
    }
});
router.delete('/remove-club', isCollegeAdmin, async (req, res) => {
    const { id } = req.query;
    try {
        const club = await Club.findByIdAndDelete(id);
        res.json({
            message: 'Club removed successfully',
            data: club,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to remove Club.',
        });
    }
});
router.delete('/remove-user', isSuperAdmin, async (req, res) => {
    const { id } = req.query;
    try {
        const user = await User.findByIdAndDelete(id);
        res.json({
            message: 'User removed successfully',
            data: college,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to remove User.',
        });
    }
});

module.exports = router;
