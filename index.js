require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const validator = require("mongoose-validator");
const autoIncrement = require("mongoose-auto-increment");
const session = require("express-session");
var cookieSession = require("cookie-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const passportLocal = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const {
  Employee,
  LeaveRequest,
  LoanBonusRequest,
  Payroll,
} = require("./schemas/schemas");

//DB config
const url = process.env.URL;
mongoose.connect(url, {
  useFindAndModify: false,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

const db = mongoose.connection;

db.once("open", (res, err) => {
  console.log("db is connected");
});

//middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "https://hr-management-a89a2.web.app", // <-- location of the react app were connecting to
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser(process.env.SECRET));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

const port = process.env.PORT || 3000;

/////////////////////////////////////////////routes//////////////////////////////////////////////////

app.get("/", function (req, res) {
  // if (req.isAuthenticated()) {
  //   console.log("authenticated");
  //   console.log(req.user);
  // }
  res.send("Hello World");
});
///////adding new employee///////////

app.post("/employees/new", (req, res) => {
  Employee.findOne({ username: req.body.username }, async (err, doc) => {
    try {
      if (err) {
        // console.log(err);
        throw err;
      }
      if (doc) res.send("User Already Exists");
      if (!doc) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new Employee({
          fullName: req.body.fullName,
          username: req.body.username,
          isAdmin: req.body.isAdmin,
          gender: req.body.gender,
          dob: req.body.dob,
          email: req.body.email,
          contact: req.body.contact,
          password: hashedPassword,
          designation: req.body.designation,
          department: req.body.department,
          salary: req.body.salary,
          city: req.body.city,
          state: req.body.state,
          pincode: req.body.pincode,
        });
        await newUser.save();
        res.send("User Created");
      }
    } catch (e) {
      console.log(e);
      res.send(e);
    }
  });
});

/////////loading all employees//////////
app.get("/employees/all", (req, res) => {
  Employee.find({ isAdmin: false }, null, {
    limit: parseInt(req.query.limit),
    skip: parseInt(req.query.skip),
  })

    .then((data) => {
      res.status(201).send(data);
      // console.log(data);
    })
    .catch((e) => {
      // console.log(e);
      res.status(500).send(e);
    });
});
//////////searching employee///////
app.post("/employees/query", (req, res) => {
  // console.log(req.body);
  Employee.find(req.body)
    .collation({ locale: "en", strength: 2 })
    .then((employees) => {
      res.status(200).send(employees);
    })
    .catch((e) => {
      // console.log(e);
      res.status(500).send(e.message);
    });
});
///////////
app.post("/employees/search/:id", (req, res) => {
  //let temp = hex.test(req.params.id) ? ObjectId(req.params.id) : req.params.id;
  let temp = new mongoose.Types.ObjectId(req.params.id);
  Employee.findById(temp)
    .then((e) => res.send(e))
    .catch((e) => res.send(e));
});
////////updating employee///////////
app.post("/employees/update/:id", (req, res) => {
  // console.log(req.body);
  Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .then((employee) => {
      res.send(employee);
    })
    .catch((e) => {
      console.log(e);
      res.status(500).send(e);
    });
});

/////////deleting employee////////
app.delete("/employees/delete", (req, res) => {
  Employee.findByIdAndDelete(req.query.id)
    .then((employee) => {
      // if (!employee) {
      //   return res.status(404).send();
      // }
      res.send(employee);
    })
    .catch((e) => res.status(500).send(e));
});

//////////////////marking attendance/////////////////
app.post("/employees/attendance", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.query.id);

    employee.presentOn.push(new Date(req.body.date));
    await employee.save();
    res.send(employee);
  } catch (e) {
    res.status(400).send(e);
  }
});

/////////////////////checking attendance//////////////
app.post("/employees/attendance/query", async (req, res) => {
  try {
    const employee = await Employee.findById(req.query.id);
    return res.status(200).send(employee.presentOn);
  } catch (e) {
    res.status(400).send(e);
  }
});

///////////////////adding payRolls////////////
app.post("/payroll/update", async (req, res) => {
  try {
    const pr = await Payroll.findOne({ username: req.body.username });
    // console.log("pr-->", pr);
    if (!pr) {
      const user = await Employee.findOne({ username: req.body.username });
      if (!user) {
        res.send("No user found");
      } else {
        const doc = new Payroll({
          username: req.body.username,
          lastPaidMonth: req.body.lastPaidMonth,
          yearOfMonth: req.body.yearOfMonth,
          salaryDue: req.body.salaryDue,
        });
        await doc.save();
        return res.status(200).send(doc);
      }
    } else {
      pr.lastPaidMonth = req.body.lastPaidMonth;
      pr.yearOfMonth = req.body.yearOfMonth;
      pr.salaryDue = req.body.salaryDue;
      await pr.save();
      res.status(200).send(pr);
    }
  } catch (e) {
    // console.log("errrr-->", e);
    res.status(500).send(e);
  }
});
/////////loading payrolls///////////
app.get("/payroll/load", async (req, res) => {
  try {
    const payroll = await Payroll.find({});
    res.status(200).send(payroll);
  } catch (e) {
    res.status(500).send(e);
  }
});

////////////Leave request///////////////////

app.post("/leavereq/create", async (req, res) => {
  try {
    const doc = new LeaveRequest({
      username: req.body.username,
      from: new Date(req.body.from),
      to: new Date(req.body.to),
      reason: req.body.reason,
      status: "pending",
    });
    console.log(doc);
    await doc.save();
    return res.status(200).send(doc);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post("/leavereq/action", async (req, res) => {
  try {
    const lr = await LeaveRequest.findById(req.body.id);
    lr.status = req.body.action;
    await lr.save();
    return res.status(200).send(lr);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/leavereq/load", async (req, res) => {
  try {
    const lr = await LeaveRequest.find({});
    res.status(200).send(lr);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/leavereq/load/:username", async (req, res) => {
  try {
    const lr = await LeaveRequest.find({ username: req.params.username });
    res.status(200).send(lr);
  } catch (e) {
    res.status(500).send(e);
  }
});
/////////////loan & bonus request//////////////
app.post("/loanbonusreq/create", async (req, res) => {
  try {
    const doc = new LoanBonusRequest({
      username: req.body.username,
      application: req.body.application,
      status: "pending",
    });
    await doc.save();
    return res.status(200).send(doc);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post("/loanbonusreq/action", async (req, res) => {
  try {
    const lbr = await LoanBonusRequest.findById(req.body.id);
    lbr.status = req.body.action;
    await lbr.save();
    return res.status(200).send(lbr);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/loanbonusreq/load", async (req, res) => {
  try {
    const lbr = await LoanBonusRequest.find({});
    res.status(200).send(lbr);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/loanbonusreq/load/:username", async (req, res) => {
  try {
    const lbr = await LoanBonusRequest.find({ username: req.params.username });
    res.status(200).send(lbr);
  } catch (e) {
    res.status(500).send(e);
  }
});

/////////////////sign up//////////////////

app.post("/register", (req, res) => {
  Employee.findOne({ username: req.body.username }, async (err, doc) => {
    try {
      if (err) throw err;
      if (doc) res.send("User Already Exists");
      if (!doc) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new Employee({
          username: req.body.username,
          password: hashedPassword,
          fullName: req.body.fullName,
          dob: new Date(req.body.dob),
          gender: req.body.gender,
          email: req.body.email,
          contact: req.body.contact,
          designation: req.body.designation,
          department: req.body.department,
          city: req.body.city,
          state: req.body.state,
          pincode: req.body.pincode,
        });
        await newUser.save();
        res.send("User Created");
      }
    } catch (e) {
      res.send(e);
    }
  });
});

////////////login/////////////////////

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("No User Exists");
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send(req.user);
        console.log("Successfully Authenticated", req.user);
      });
    }
  })(req, res, next);
});

app.get("/logout", function (req, res) {
  req.logout();
  res.send("successfull");
});

app.get("/user", (req, res) => {
  res.send(req.user); // The req.user stores the entire user that has been authenticated inside of it.
});
//////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
  console.log("server started on port 3000");
});
