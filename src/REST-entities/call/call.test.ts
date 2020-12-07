import { Application } from "express";
import mongoose, { Document } from "mongoose";
import supertest, { Response } from "supertest";
import path from "path";
import Server from "../../server/server";
import { IUser, ICall } from "../../helpers/typescript-helpers/interfaces";
import UserModel from "../../REST-entities/user/user.model";
import SessionModel from "../session/session.model";
import CallModel from "./call.model";

describe("Call router test suite", () => {
  let app: Application;
  let response: Response;
  let createdUser: Document | null;
  let createdCall: Document | null;
  let accessToken: string;

  beforeAll(async () => {
    app = new Server().startForTesting();
    const url = `mongodb://127.0.0.1/call`;
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    await supertest(app)
      .post("/auth/register")
      .send({ email: "test@email.com", password: "qwerty123" });
    response = await supertest(app)
      .post("/auth/login")
      .send({ email: "test@email.com", password: "qwerty123" });
    accessToken = response.body.accessToken;
    createdUser = await UserModel.findById(response.body.user.id);
  });

  afterAll(async () => {
    await UserModel.deleteOne({ email: "test@email.com" });
    await SessionModel.deleteOne({ _id: response.body.sid });
    await mongoose.connection.close();
  });

  describe("POST /call", () => {
    let response: Response;

    context("Valid request", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", 1)
          .field("phone", "+380000000000")
          .attach("file", path.join(__dirname, "./test-files/test.jpg"))
          .attach("file", path.join(__dirname, "./test-files/test.jpg"));
        createdUser = await UserModel.findOne({
          _id: (createdUser as IUser)._id,
        }).lean();
        createdCall = await CallModel.findOne({
          userId: (createdUser as IUser)._id,
        }).lean();
      });

      it("Should return a 201 status code", () => {
        expect(response.status).toBe(201);
      });

      it("Should return an expected result", () => {
        expect(response.body).toEqual({
          title: "Test",
          description: "Test",
          category: "transport",
          price: 1,
          phone: "+380000000000",
          isOnSale: false,
          imageUrls: response.body.imageUrls,
          id: (createdCall as ICall)._id.toString(),
          userId: (createdUser as IUser)._id.toString(),
        });
      });

      it("Should create 2 images", () => {
        expect(response.body.imageUrls.length).toBe(2);
      });

      it("Should create a new call in DB", () => {
        expect(createdCall).toBeTruthy();
      });

      it("Should add new call to user's calls in DB", () => {
        expect((createdUser as IUser).calls[0]).toEqual({
          title: "Test",
          description: "Test",
          category: "transport",
          price: 1,
          phone: "+380000000000",
          isOnSale: false,
          imageUrls: (createdCall as ICall).imageUrls,
          userId: (createdUser as IUser)._id,
          _id: (createdUser as IUser).calls[0]._id,
          __v: 0,
        });
      });
    });

    context("Invalid request ('title' is not provided)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("description", "Test")
          .field("category", "transport")
          .field("price", 1)
          .field("phone", "+380000000000")
          .attach("file", path.join(__dirname, "./test-files/test.jpg"));
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'title' is required", () => {
        expect(response.body.message).toEqual('"title" is required');
      });
    });

    context("Invalid request ('file' is txt file)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", 1)
          .field("phone", "+380000000000")
          .attach("file", path.join(__dirname, "./test-files/test.txt"));
      });

      it("Should return a 415 status code", () => {
        expect(response.status).toBe(415);
      });

      it("Should say that only image files are allowed", () => {
        expect(response.body.message).toEqual("Only image files are allowed");
      });
    });

    context("Invalid request ('price' is below 0)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", -1)
          .field("phone", "+380000000000")
          .attach("file", path.join(__dirname, "./test-files/test.jpg"));
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'price' must be greater than or equal to 0", () => {
        expect(response.body.message).toEqual(
          '"price" must be greater than or equal to 0'
        );
      });
    });

    context("Invalid request ('price' is an array)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", [1, 2, 3])
          .field("phone", "+380000000000")
          .attach("file", path.join(__dirname, "./test-files/test.jpg"));
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'price' must be a number", () => {
        expect(response.body.message).toEqual('"price" must be a number');
      });
    });

    context("Invalid request (invalid 'phone' format)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", 1)
          .field("phone", "+38000000000")
          .attach("file", path.join(__dirname, "./test-files/test.jpg"));
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'phone' has an invalid format", () => {
        expect(response.body.message).toEqual(
          "Invalid 'phone'. Please, use +380000000000 format"
        );
      });
    });

    context("Invalid request ('category' is invalid)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "qwerty123")
          .field("price", 1)
          .field("phone", "+380000000000")
          .attach("file", path.join(__dirname, "./test-files/test.jpg"));
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'category' must be an enum member", () => {
        expect(response.body.message).toEqual(
          '"category" must be one of [business and services, electronics, free, property, recreation and sport, trade, transport, work]'
        );
      });
    });

    context("Invalid request (extra field)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", 1)
          .field("phone", "+380000000000")
          .field("extra", "")
          .attach("file", path.join(__dirname, "./test-files/test.jpg"));
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'extra' is not allowed", () => {
        expect(response.body.message).toEqual('"extra" is not allowed');
      });
    });

    context("Without providing 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", 1)
          .field("phone", "+380000000000");
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say token wasn't provided", () => {
        expect(response.body.message).toEqual("No token provided");
      });
    });

    context("With invalid 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/call")
          .set("Authorization", `Bearer qwerty123`)
          .field("title", "Test")
          .field("description", "Test")
          .field("category", "transport")
          .field("price", 1)
          .field("phone", "+380000000000");
      });

      it("Should return a 401 status code", () => {
        expect(response.status).toBe(401);
      });

      it("Should say token wasn't provided", () => {
        expect(response.body.message).toEqual("Unauthorized");
      });
    });
  });

  describe("POST /call/favourite/{callId}", () => {
    let response: Response;

    context("Valid request", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/call/favourite/${(createdCall as ICall)._id}`)
          .set("Authorization", `Bearer ${accessToken}`);
        createdUser = await UserModel.findById({
          _id: (createdUser as IUser)._id,
        }).lean();
      });

      it("Should return a 200 status code", () => {
        expect(response.status).toBe(200);
      });

      it("Should return an expected result", () => {
        expect(response.body).toEqual({
          newFavourites: (createdUser as IUser).favourites.map((call) => {
            (call._id = call._id.toString()),
              (call.userId = call.userId.toString());
            return call;
          }),
        });
      });

      it("Should add to user's favourites in DB", () => {
        expect((createdUser as IUser).favourites[0]).toEqual({
          title: "Test",
          description: "Test",
          category: "transport",
          price: 1,
          phone: "+380000000000",
          isOnSale: false,
          imageUrls: (createdCall as ICall).imageUrls,
          userId: (createdUser as IUser)._id.toString(),
          _id: (createdUser as IUser).calls[0]._id.toString(),
          __v: 0,
        });
      });
    });

    context("Adding already favourited call to favourites", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/call/favourite/${(createdCall as ICall)._id}`)
          .set("Authorization", `Bearer ${accessToken}`);
      });

      it("Should return a 403 status code", () => {
        expect(response.status).toBe(403);
      });

      it("Should say that it's already in favourites", () => {
        expect(response.body.message).toBe("Already in favourites");
      });
    });

    context("Without providing 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app).post(
          `/call/favourite/${(createdCall as ICall)._id}`
        );
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that token wasn't provided", () => {
        expect(response.body.message).toBe("No token provided");
      });
    });

    context("With invalid 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/call/favourite/${(createdCall as ICall)._id}`)
          .set("Authorization", `Bearer qwerty123`);
      });

      it("Should return a 401 status code", () => {
        expect(response.status).toBe(401);
      });

      it("Should return an unauthorized status", () => {
        expect(response.body.message).toBe("Unauthorized");
      });
    });

    context("With invalid 'callId'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/call/favourite/qwerty123`)
          .set("Authorization", `Bearer ${accessToken}`);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'callId' is invalid", () => {
        expect(response.body.message).toBe(
          "Invalid 'callId'. Must be a MongoDB ObjectId"
        );
      });
    });
  });

  describe("DELETE /call/favourite/{callId}", () => {
    let response: Response;

    context("Valid request", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .delete(`/call/favourite/${(createdCall as ICall)._id}`)
          .set("Authorization", `Bearer ${accessToken}`);
        createdUser = await UserModel.findById({
          _id: (createdUser as IUser)._id,
        }).lean();
      });

      it("Should return a 200 status code", () => {
        expect(response.status).toBe(200);
      });

      it("Should return an expected result", () => {
        expect(response.body).toEqual({
          newFavourites: (createdUser as IUser).favourites.map((call) => {
            (call._id = call._id.toString()),
              (call.userId = call.userId.toString());
            return call;
          }),
        });
      });

      it("Should delete from user's favourites in DB", () => {
        expect((createdUser as IUser).favourites[0]).toEqual(undefined);
      });
    });

    context("Deleting an already deleted call from favourites", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .delete(`/call/favourite/${(createdCall as ICall)._id}`)
          .set("Authorization", `Bearer ${accessToken}`);
      });

      it("Should return a 403 status code", () => {
        expect(response.status).toBe(403);
      });

      it("Should say that it's not in favourites", () => {
        expect(response.body.message).toBe("Not in favourites");
      });
    });

    context("Without providing 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app).delete(
          `/call/favourite/${(createdCall as ICall)._id}`
        );
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that token wasn't provided", () => {
        expect(response.body.message).toBe("No token provided");
      });
    });

    context("With invalid 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .delete(`/call/favourite/${(createdCall as ICall)._id}`)
          .set("Authorization", `Bearer qwerty123`);
      });

      it("Should return a 401 status code", () => {
        expect(response.status).toBe(401);
      });

      it("Should return an unauthorized status", () => {
        expect(response.body.message).toBe("Unauthorized");
      });
    });

    context("With invalid 'callId'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .delete(`/call/favourite/qwerty123`)
          .set("Authorization", `Bearer ${accessToken}`);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'callId' is invalid", () => {
        expect(response.body.message).toBe(
          "Invalid 'callId'. Must be a MongoDB ObjectId"
        );
      });
    });
  });
});
