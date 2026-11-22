import { body } from "express-validator";
import { availableTaskStatus, availableUsers } from "../utils/constants.js";
export const validateRegisterUser = () => {
  return [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Email is not valid")
      .notEmpty()
      .withMessage("Email is required"),
    body("username")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be within 3 to 20 characters")
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase"),
    body("password").isEmpty().withMessage("Password is required"),
    //   .isStrongPassword({
    //     minLength: 8,
    //     minLowercase: 1,
    //     minUppercase: 1,
    //     minNumbers: 1,
    //   })
    //   .withMessage("Password must be strong"),
  ];
};

export const validateLoginUser = () => {
  return [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Email is not valid")
      .notEmpty()
      .withMessage("Email is required"),
    body("password").isEmpty().withMessage("Password is required"),
  ];
};

export const validateForgotPassword = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Email is not valid")
      .notEmpty()
      .withMessage("Email is required"),
  ];
};

export const validateResetPassword = () => {
  return [
    body("password")
      // .isStrongPassword({
      //   minLength: 8,
      //   minLowercase: 1,
      //   minUppercase: 1,
      //   minNumbers: 1,
      // })
      // .withMessage("Password must be strong"),
      .notEmpty()
      .withMessage("Password is required"),
  ];
};

export const validateChangePassword = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword")
      // .isStrongPassword({
      //   minLength: 8,
      //   minLowercase: 1,
      //   minUppercase: 1,
      //   minNumbers: 1,
      // })
      // .withMessage("Password must be strong"),
      .notEmpty()
      .withMessage("New password is required"),
  ];
};

export const validateCreateProject = () => {
  return [
    body("name").notEmpty().withMessage("Name can not be empty"),
    body("description").optional(),
  ];
};
export const validateAddMemberToProject = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("email can not be empty")
      .isEmail()
      .withMessage("it should be an email"),
    body("role")
      .isEmpty()
      .withMessage("role cannot be empty")
      .isIn(availableUsers)
      .withMessage("role is invalid"),
  ];
};
export const validateUpdateProject = () => {
  return [
    body("name").notEmpty().withMessage("Name can not be empty"),
    body("description").optional(),
  ];
};

export const validateUpdateMemberRole = () => {
  return [
    body("newRole")
      .isEmpty()
      .withMessage("Role can not be empty")
      .isIn(availableUsers)
      .withMessage("role is invalid"),
  ];
};

// task controller validators

export const validateCreateTask = () => {
  return [
    body("name").notEmpty().withMessage("Title can not be empty").trim(),
    body("content").optional().trim(),
    body("status")
      .isEmpty()
      .withMessage("status can not be empty")
      .isIn(availableTaskStatus)
      .withMessage("status is invalid"),
    body("assignedTo")
      .isEmpty()
      .withMessage("asignee can not be empty")
      .isAlphanumeric()
      .withMessage("asignee should be an alphanumeric string"),
  ];
};

export const validateUpdateTask = () => {
  return [
    body("name").optional().trim(),
    body("content").optional().trim(),
    body("status")
      .optional()
      .isIn(availableTaskStatus)
      .withMessage("status is invalid")
      .trim(),
    body("assignedTo")
      .optional()
      .isAlphanumeric()
      .withMessage("asignee should be an alphanumeric string")
      .trim(),
  ];
};

export const validateCreateSubTask = () => {
  return [
    body("title").notEmpty().withMessage("title cannot be empty").trim(),
    body("content").optional().trim(),
  ];
};

export const validateUpdateSubTask = () => {
  return [body("title").optional().trim(), body("content").optional().trim()];
};

export const validateCreateNote = () => {
  return [body("title").notEmpty().withMessage("title cannot be empty").trim()];
};

export const validateUpdateNote = () => {
  return [body("title").optional().trim()];
};
