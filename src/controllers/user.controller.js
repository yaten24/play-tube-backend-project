import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js'; 
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';

//function to generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong")
    }
}

//controller for the register route
const registerUser = asyncHandler(async (req, res) => {
    // get user detail from frontend
    // validation -> check empty
    // check if user already exist or not using: email or username
    // check for  images, check for avatar
    // upload them to cloudinary -> avatar
    // create user object - create entry in database
    // remove password and refresh token field from response
    // check for User creation 
    // return response 
 
    const {username, email, fullname, password}  = req.body;
    if (
        [fullname, email, username, password].some((field) => {
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({email})
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverimage[0]?.path;
    if( !avatarLocalPath ){
        throw new ApiError(400, "Avatar is required 1");
    }
    console.log(avatarLocalPath);
    console.log(coverImageLocalPath)

    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar) {
        throw new ApiError(400, "Avatar id required 2");
    }

    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" 
    )
    if( !createdUser ) {
        throw new ApiError(500, "Something went wrong while registering the user !! please try again")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

//controller for login route
const loginUser = asyncHandler(async (req, res) => {
    //req.body ->  data
    //validate username and email
    //find the user from the data base 
    //check the password is correct or not
    //access and refresh token 
    //send the token the user by using cookie 
    
    const {username, email, password} = req.body;
    if(!username || !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    
    )
})

//method for logout 
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("", options)
    .clearCookie("", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

//method for Regenerate Access token
const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Access")
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(401, "Unauthorized Access")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Unauthorized access")
    }

    const {accessToken, newrefreshToken} = generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newrefreshToken},
            "Token Generated Successfully"
        )
    )
})

//Method to change the passsword 
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword , newPassword} = req.body;
    if (!oldPassword) {
        throw new ApiError(401, "Old Password is required");
    }
    if (!newPassword) {
        throw new ApiError(401, "new password is required");
    }
    const user = await  User.findById(req.user?.id);
    if (!user) {
        throw new ApiError(401, "Invalid Request");
    }
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect Password");
    }
    user.password = newPassword;
    await user.save({
        validateBeforeSave: false
    })
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully")); 
})

//Method to get current user 
const getCurrentuser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current User Feteched Succesfully")
})

//Method to update user detail
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body;
    if(!fullname || !email) {
        throw new ApiError(401, "All fiels are required")
    }
    // const user = await User.findById(req.user?.id);
    // if (!user){
    //     throw new ApiError(400, "Invalid request")
    // }
    // user.fullname = fullname;
    // user.email = email;
    // await user.save({
    //     validateBeforeSave: false
    // })
    // return res
    // .status(200)
    // .json(200, "Detals updated succesfully")
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { 
            new: true
        }
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Details Updated succesfully"))
})

//Method to update user avatar
const updateUserAvatar = asyncHandler(async(req, res) => {
    const updatedAvatarLocalPath = req.file?.path;
    if(!updatedAvatarLocalPath){
        throw new ApiError(401, "Avatar field is missing")
    }
    const avatar = await uploadOnCloudinary(updatedAvatarLocalPath);
    if(!avatar.url){
        throw new ApiError(401, "Error occured while uploading")
    }
    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image Updated Successfully"))
})

//Method to update user coverImage 
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const updatedCoverImageLocalPath = req.file?.path;
    if(!updatedCoverImageLocalPath){
        throw new ApiError(400, "Cover Image is missing")
    }
    const coverimage = await uploadOnCloudinary(updatedCoverImageLocalPath);
    if(!coverimage){
        throw new ApiError(500, "Error while uloading the Cover Image");
    }
    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set: {
                coverimage: coverimage.url
            }
        },
        {
            new: true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    )
})

//method to get the user details 
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "subscribers.subscriber"]},
                        than: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverimage: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length){
        throw new ApiError(400, "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel,
            "Channel fateched successfully"
        )
    )
})

//method to get watch history 
const getUserWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History fateched succesfully"
        )
    )
})

export {
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
}