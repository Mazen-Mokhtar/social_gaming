const generateMessage = (entity) => {
    return {
        notFound: `${entity} Not Found`,
        alreadyExist: `${entity} Already Exist`,
        createdSuccessfully: `${entity} Created Successfully`,
        updatedSuccessfully: `${entity} Updated Successfully`,
        deletedSuccessfully: `${entity} Deleted Successfully`,
        failToCreate: `Fail To Create ${entity}`,
        failToUpdate: `Fail To Update ${entity}`,
        failToDelete: `Fail To Delete ${entity}`
    }
}
export const messageSystem =
{
    user: {
        ...generateMessage("User"),
        incorrectPassword: "Incorrect Password ",
        emailActive: "Email Created but Ative Your Email From Message Gmail First",
        emailIsActived: "Email is active you con login now",
        invalid: "Invalid User",
        login: "Login Successfully",
        yourProfile: "Your Profile",
        token: "Invalid Token",
        resetCode: "Sended Your Code In Gmail Message",
        expiredCode: "Invalid or expired reset token",
        notAuthorized: "Not Authorized",
        authorization: "Authorization Is Required",
        isAlreadyDeleted: "User Is Already Deleted",
        freezeAcc: "User Is Freezed In 60 Days Login To Return The Account ",
        dontHaveBlockListYet: "Dont Have block list yet"
    },
    friend: {
        ...generateMessage("Friend Requset"),
        noFriends: "Dont Have friends yet",
        alreadyFriends: "Your Already Friends",
        suggestions: "Dont Have Suggestions Friends",
        mutualFriends: "No Mutual Friends",
        alreadyblocked: "Your Already Block This User",
        youBlocked: "You Blocked This User",
        heBlocked: "This User Is Blocked You",
        requestCancelled: "Request Cancelled Successfully",
        cancelFriend: "Cancelled Friend Successfully"
    },
    post: {
        ...generateMessage("Post"),
        invalid: "Invalid Post",
        like: "Like Post Successfully",
        unLike: "UnLike Post Successfully",
        mustPic: "Must Send Picture",
        mustPassed: "Must Post Passed 24 Hours From Posted ❌",
        passedDeleted: " Post Passed 2 min From Posted Sorry Cant't Deleted ❌",
        undoArchive: "Post Undo Successfully ☺",
        archive: "Post Archive Successfully"

    },
    message: { ...generateMessage("Message"), cSendYourSelf: "You Can't Send Your Self", chatNotFound: `Chat Not Found` },
    comment: {
        ...generateMessage("Comment"),
        invalid: "Invalid Comment",
        notAuthorized: "Not Authorized",
        like: "Like Comment Successfully",
        unLike: "UnLike Comment Successfully"
    },
    errors: {
        email: {
            invalid: "The email address you entered is not valid.",
            taken: "An account with this email address already exists.",
        },
        password: {
            weak: "Your password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.",
            mismatch: "The passwords do not match.",
        },
        required: "This field is required.",
        username: {
            taken: "This username is already taken. Please choose another one.",
        },
        date: {
            invalid: "The date you entered is invalid. Please use the format DD/MM/YYYY.",
        },
        phone: {
            invalid: "Please enter a valid phone number."
        },
        length: {
            tooShort: (min) => `The input is too short. It must be at least ${min} characters long.`,
            tooLong: (max) => `The input is too long. It cannot exceed ${max} characters.`,
        },
        code: "You reached The Maximum Of Attempts Please Wait 5m And Try Again "
    }
}