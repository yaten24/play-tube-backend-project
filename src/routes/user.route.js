import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentuser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getUserWatchHistory 
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

//unsecured routes
router.route('/register')
.post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
);
router.route('/login')
.post(loginUser);
router.route('/refresh-token')
.post(refreshAccessToken)

//secured routes 
router.route('/logout')
.post(verifyJWT, logoutUser)
router.route('/change-password')
.post(verifyJWT, changeCurrentPassword)
router.route('/current-user')
.get(verifyJWT, getCurrentuser)
router.route('/update-account-details')
.patch(verifyJWT, updateAccountDetails)
router.route('update-avatar')
.patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route('update-user-cover-image')
.patch(verifyJWT, upload.single("coverimage"), updateUserCoverImage)
router.route('/channel/:username')
.get(verifyJWT, getUserChannelProfile)
router.route('/user-watch-history')
.get(verifyJWT, getUserWatchHistory)

export default router