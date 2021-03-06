const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { check, validationResult } = require('express-validator/check');
const request = require('request');
const config = require('config');

// @route GET api/profile/me
// @desc Get current users Profile
// @access Private

router.get('/me', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });

        }
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route POST api/profile
// @desc Create or update user profile
// @access Private

router.post('/', [auth, [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'Skills is required').not().isEmpty()
    ]]

    , async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername)
            profileFields.githubusername = githubusername;

        // Skills - Spilt into array
        if (skills) {
            profileFields.skills = skills.split(',');
        }

        // Social
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, {
                        new: true
                    }

                );
                return res.json(profile);
            }
            // Creating profile if it doesn't exists
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);


        } catch (err) {

            console.error(err.message);
            res.status(500).send('Server Error');
        }

    });



// @route   GET api/profile
// @desc    Get all profiles
// @access  Public

router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'], User);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public

router.get('/user/:user_id', async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'], User);
        if (!profile)
            return res.status(400).json({ msg: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId')
            return res.status(400).json({ msg: 'Profile not found' });
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/profile
// @desc    Delete profile,user and posts
// @access  Private

router.delete('/', auth, async(req, res) => {
    try {
        await Post.deleteMany({ user: req.user.id });
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route PUT api/profile/experience
// @desc Add/update profile experience
// @access Private

router.put('/experience', [auth, [
        check('title', 'title is required').not().isEmpty(),
        check('company', 'company is required').not().isEmpty(),
        check('from', 'from date is required').not().isEmpty()
    ]]

    , async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;
        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);
            await profile.save();
            res.json({ profile });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    }
);


// @route DELETE api/profile/experience/:exp_id
// @desc  delete experience from profile
// @access Private

router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // Getting experience index number
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        // Splicing the index number
        profile.experience.splice(removeIndex, 1);
        // Saving the new profile
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
});

// @route PUT api/profile/education
// @desc Add/update profile education
// @access Private

router.put('/education', [auth, [
        check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ]]

    , async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;
        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);
            await profile.save();
            res.json({ profile });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    }
);


// @route DELETE api/profile/education/:edu_id
// @desc  delete education from profile
// @access Private

router.delete('/education/:edu_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // Getting experience index number
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        // Splicing the index number
        profile.education.splice(removeIndex, 1);
        // Saving the new profile
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
});


//@route GET api/profile/github/:username
//@desc get user repos from Github 
//@access Public

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };
        request(options, (error, response, body) => {
            if (error)
                console.error(error);
            if (response.statusCode != 200) {
                return res.status(404).json({ msg: 'No Github Profile Found' });
            }
            res.json(JSON.parse(body));
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;