const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: true,
      index: {
        collation: { locale: "en", strength: 2 },
      },
    },
    username: {
      type: String,
      required: true,
      index: {
        unique: true,
        collation: { locale: "en", strength: 2 },
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      trim: true,
      required: true,
      default: null,
    },
    dob: {
      type: Date,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      index: {
        unique: true,
        collation: { locale: "en", strength: 2 },
      },
    },
    contact: {
      trim: true,
      type: String,
      // required: true,
      index: {
        unique: true,
      },
    },
    password: { type: String },
    designation: { type: String },
    department: { type: String },
    team: {
      type: String,
      index: {
        collation: { locale: "en", strength: 2 },
      },
    },
    salary: { type: Number },
    projectIds: {
      type: [{ type: mongoose.ObjectId, ref: "Project" }],
    },
    presentOn: [
      {
        type: Date,
      },
    ],
    city: { type: String },
    state: { type: String },
    pincode: { type: Number },
  },
  { timestamps: true }
);
const Employee = new mongoose.model("Employee", employeeSchema);

const projectSchema = new mongoose.Schema({
  pname: {
    type: String,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  leader: {
    type: String,
  },
  team: [{ type: Number }],
});

const Project = new mongoose.model("Project", projectSchema);

const leaveReqSchema = new mongoose.Schema(
  {
    username: {
      // type: mongoose.ObjectId,
      // ref: "Employee",
      type: String,
    },
    from: {
      type: Date,
    },
    to: {
      type: Date,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);
const LeaveRequest = new mongoose.model("LeaveRequest", leaveReqSchema);
const loanAndBonusSchema = new mongoose.Schema(
  {
    username: {
      // type: mongoose.ObjectId,
      // ref: "Employee",
      type: String,
    },
    application: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);
const LoanBonusRequest = new mongoose.model(
  "LoanBonusRequest",
  loanAndBonusSchema
);
const payRollSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  lastPaidMonth: {
    type: String,
  },
  yearOfMonth: {
    type: Number,
  },
  salaryDue: {
    type: Number,
  },
});
const Payroll = new mongoose.model("Payroll", payRollSchema);

module.exports = {
  Employee,
  LeaveRequest,
  LoanBonusRequest,
  Payroll,
};
