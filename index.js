const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const {encrypt, decrypt}= require("./Encryption")
const PORT = 8080;
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
let db = mysql.createConnection({
  host: "us-cdbr-east-05.cleardb.net",
  user: "bccc4349207b67",
  password: "bafe286e",
  database: "heroku_58b74d518fa415f",
});
db.connect(function (err) {
  if (err) {
    return console.error("error: " + err.message);
  }

  console.log("Connected to the MySQL server.");
  console.log("Connected to the MySQL server.");
  setInterval(function () {
    console.log("c");
    db.query("SELECT 1");
  }, 5000);
});

app.get('/', function(req, res){
  res.send("Welcome to Cryptovest Trading Bot")
})

app.post("/tradex/register", function (req, res) {
  db.query(
    "SELECT email from users WHERE email=?",
    [req.body.email],
    (err, result) => {
      console.log(result);
      if (result.length < 1) {
        bcrypt.hash(req.body.password, 10).then((hash) => {
          //  store user details in the database server
          db.query(
            "INSERT INTO users (fname, email, password) VALUES (?, ?, ?)",
            [req.body.fullname, req.body.email, hash],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                res.send({
                  message: "Account Successfully created!",
                  registeration: true,
                });
              }
            }
          );
        });

        
      } else {
        res.send({
          message: "Email Already Exists!",
          registeration: false,
        });
      }
    }
  );
});

app.post("/tradex/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  db.query(
    "SELECT id, fname from users WHERE email=? AND password=?",
    [email, password],
    (err, result) => {
      if (result.length < 1) {
        res.send({
          message: "Wrong email or password!",
          registeration: false,
         
        });
      } else {
        console.log(result)
        res.send({
          message: "Logged In!",
          registeration: true,
          id:result[0].id,
          fname:result[0].fname
        });
      }
    }
  );
});

app.post("/tradex/getuser", function (req, res) {
  const id = req.body.id;
  console.log(id);
  db.query(
    "SELECT apikey, secretkey, iv from details WHERE UserId=?",
    [req.body.id],
    (err, result) => {
     if(result.length<0){
       res.send({data:false})
     } else{
       res.send({data:true, result, secretkey:decrypt({message:result[0].secretkey, iv:result[0].iv})})
     }
    }
  );
});

app.post("/tradex/saveapi", function (req, res) {
  db.query(
    "SELECT * from details WHERE UserId=?",
    [req.body.userid],
    (err, result) => {
      console.log(result);
      if (result.length < 1) {
        const encrptmessage = encrypt(req.body.secret)
        db.query(
          "INSERT INTO details (apikey, secretkey,iv, tradingstatus, UserId) VALUES (?, ?,?, ?, ?)",
          [req.body.api, encrptmessage.message,encrptmessage.iv, false, req.body.userid],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send({
                message: "Details Successfully Updated!",
                status: true,
              });
            }
          }
        );
      } else {
        console.log("found");
        const encrptmessage = encrypt(req.body.secret)

        db.query(
          "UPDATE details SET apikey=?, secretkey=?, iv=?, tradingstatus=? WHERE UserId=?",
          [req.body.api, encrptmessage.message,encrptmessage.iv, false, req.body.userid],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send({
                message: "Details Successfully Updated!",
                status: true,
              });
            }
          }
        );
      }
    }
  );
});

app.listen(process.env.PORT || PORT, function () {
  console.log("Server is Running");
});
