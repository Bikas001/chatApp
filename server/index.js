const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
app.use(express.json());
const harperSaveMessage = require("./services/harper-save-message"); // Add this
const harperGetMessages = require("./services/harper-get-messages"); // Add this
const leaveRoom = require("./utils/leave-room");
const { default: axios } = require("axios");

require("dotenv").config();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const CHAT_BOT = "ChatBot";
let chatRoom = "";
let allUsers = [];

io.on("connection", (socket) => {
  console.log(socket);
  console.log(`User connected ${socket.id}`);

  socket.on("join_room", (data) => {
    const { username, room } = data;
    console.log(username);
    socket.join(room);

    let __createdtime__ = Date.now();

    socket.to(room).emit("receive_message", {
      message: `${username} has joined the chat room`,
      username: CHAT_BOT,
      __createdtime__,
    });

    // Add this
    // Send welcome msg to user that just joined chat only
    socket.emit("receive_message", {
      message: `Welcome ${username}`,
      username: CHAT_BOT,
      __createdtime__,
    });

    chatRoom = room;
    allUsers.push({ id: socket.id, username, room });
    chatRoomUsers = allUsers.filter((user) => user.room === room);
    socket.to(room).emit("chatroom_users", chatRoomUsers);
    socket.emit("chatroom_users", chatRoomUsers);

    socket.on("send_message", (data) => {
      const { message, username, room, __createdtime__ } = data;
      io.in(room).emit("receive_message", data); // send to all users in room, including sender
      harperSaveMessage(message, username, room, __createdtime__)
        .then((response) => console.log(response))
        .catch((err) => console.log(err));
    });

    harperGetMessages(room)
      .then((last100Messages) => {
        socket.emit("last_100_messages", last100Messages);
      })
      .catch((err) => console.log(err));

    socket.on("leave_room", (data) => {
      const { username, room } = data;
      socket.leave(room);
      const __createdtime__ = Date.now();

      //remove user from memory
      allUsers = leaveRoom(socket.id, allUsers);
      chatRoomUsers = allUsers.filter((user) => user.room === room);
      socket.to(room).emit("chatroom_users", chatRoomUsers);
      socket.to(room).emit("receive_message", {
        username: CHAT_BOT,
        message: `${username} has left the chat`,
        __createdtime__,
      });
      console.log(`${username} has left the chat`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected from the chat`);
      const user = allUsers.find((user) => user.id == socket.id);
      console.user(user);
      chatRoomUsers = allUsers.filter((user) => user === user);

      socket.to(chatRoom).emit("chatroom_users", chatRoomUsers);
      socket.to(chatRoom).emit("receive_message", {
        message: `${user.username} has disconnected from the chat.`,
        __createdtime__: Date.now(),
      });
    });
  });
});

app.post("/register/api", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (!(email && password && first_name && last_name)) {
      return res.status(400).send("All input is required");
    }

    const fetchUser = async (email) => {
      let data = JSON.stringify({
        operation: "sql",
        sql: `SELECT * FROM chatapp.users WHERE email = '${email}'`,
      });

      let config = {
        method: "post",
        url: "https://cloud-cbikas.harperdbcloud.com",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic dmNiaWthc2g6QmlrYXNAMTIzIUAj",
        },
        data: data,
      };
      return new Promise((resolve, reject) => {
        axios(config)
          .then(function (response) {
            resolve(response.data);
          })
          .catch(function (error) {
            reject(error);
          });
      });
    };

    const oldUser = await fetchUser(email);
    if (oldUser.length) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    encryptedPassword = await bcrypt.hash(password, 10);

    const saveUser = async ({
      first_name,
      last_name,
      email,
      encryptedPassword,
    }) => {
      var data = JSON.stringify({
        operation: "insert",
        schema: "chatapp",
        table: "users",
        records: [
          {
            first_name,
            last_name,
            email,
            encryptedPassword,
          },
        ],
      });

      var config = {
        method: "post",
        url: "https://cloud-cbikas.harperdbcloud.com",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic dmNiaWthc2g6QmlrYXNAMTIzIUAj",
        },
        data: data,
      };

      return new Promise((resolve, reject) => {
        axios(config)
          .then(function (response) {
            resolve(response.data);
          })
          .catch(function (error) {
            reject(error);
          });
      });
    };

    const user = await saveUser({
      first_name,
      last_name,
      email,
      encryptedPassword,
    });

    console.log(user);

    // Create token
    const token = jwt.sign(
      { user_id: user.id, email },
      "ijndhifkndhfobkndjjfudfdf",
      {
        expiresIn: "2h",
      }
    );
    user.token = token;

    // return new user
    res.status(201).json(user);
  } catch (e) {
    console.log(e);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    const fetchUser = async ({ email }) => {
      var data = JSON.stringify({
        operation: "sql",
        sql: `SELECT * FROM chatapp.users WHERE email = '${email}'`,
      });

      var config = {
        method: "post",
        url: "https://cloud-cbikas.harperdbcloud.com",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic dmNiaWthc2g6QmlrYXNAMTIzIUAj",
        },
        data: data,
      };

      return new Promise((resolve, reject) => {
        axios(config)
          .then(function (response) {
            resolve(response.data);
          })
          .catch(function (error) {
            reject(error);
          });
      });
    };

    const user = await fetchUser({ email });
    if (user.length && (await bcrypt.compare(password, user[0].encryptedPassword))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        "ijndhifkndhfobkndjjfudfdf",
        {
          expiresIn: "2h",
        }
      );

      // save user token
      user.token = token;

      // user
      res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (e) {
    console.log(e);
  }
});

server.listen(4000, () => {
  console.log(`Server running on port 4000 `);
});
