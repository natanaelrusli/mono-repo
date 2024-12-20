import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { User } from "shared-types/Entities";
import { UpdateProfilePayload, LoginCredentials } from "shared-types/ApiRequests"

import { UserCollection } from "../repository/userCollection";
import { db } from "../config/firebaseConfig";
import { AuthRequest } from "../middleware/authMiddleware";
import { ResponseError } from "../errors/responseError";
import { sendResponse } from "../utils/responseHelper";``
import { validateEmail } from "utils";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export class UserController {
  static async getUserData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as User;
      if (!user) {
        throw new ResponseError(403, "Unauthorized access")
      }

      const users = await UserCollection.getOneUserByEmail(db, user.email);
      sendResponse(res, 200, "User data fetched successfully", {
        email: users?.email,
        name: users?.name,
      });
    } catch (e) {
      next(e);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password, name } = req.body;

    try {
      if (!validateEmail(email)) {
        throw new ResponseError(400, "Invalid Email");
      }

      const emailExists = await UserCollection.getOneUserByEmail(db, email);
      if (emailExists) {
        throw new ResponseError(400, "Email already exists.");
      }

      const newUser = await UserCollection.createUser(db, { email, password, name });
      sendResponse(res, 201, "User created successfully", newUser);
    } catch (e) {
      next(e);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const requestUser = req.user as User;
    const { name, email } = req.body as Partial<UpdateProfilePayload>;

    try {
      if (email === requestUser.email && name === requestUser.name) {
        throw new ResponseError(400, "No updated data provided");
      }

      if (!email) {
        throw new ResponseError(400, "Please provide data to update");
      }

      if (!validateEmail(email)) {
        throw new ResponseError(400, "Invalid Email");
      }

      if (!name) {
        throw new ResponseError(400, "Please provide name to update");
      }

      if (!requestUser) {
        throw new ResponseError(403, "Unauthorized access");
      }

      const userData = await UserCollection.getOneUserByEmail(db, requestUser.email);

      const updateData = {
        name: name || userData?.name,
        email: email || userData?.email,
        password: userData?.password,
      } as User;

      await UserCollection.updateUser(db, requestUser.userId, updateData);
      sendResponse(res, 200, "User updated successfully");
    } catch (e) {
      next(e);
    }
  }

  static async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body as LoginCredentials;

    try {
      const userData = await UserCollection.getOneUserByEmail(db, email);

      const isPasswordValid = await bcrypt.compare(password, userData?.password || '');

      if (isPasswordValid) {
        const token = jwt.sign(
          { userId: userData?.userId, email: userData?.email, name: userData?.name },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        sendResponse(res, 200, "Login successful", { token });
      } else {
        sendResponse(res, 401, "Invalid email or password.");
      }
    } catch (e) {
      next(e);
    }
  }
}
