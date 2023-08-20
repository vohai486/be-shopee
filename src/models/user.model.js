const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const DOCUMENT_NAME = "User";
const COLLECTION_NAME = "Users";
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, maxLength: 150 },
    lastName: { type: String, trim: true, maxLength: 150 },
    fullName: { type: String, trim: true, maxLength: 150 },
    email: {
      type: String,
      required: [true, "Please procvide your email"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    avatar: { type: String, default: "" },
    role: {
      type: Array,
      default: [],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
      // dùng select khi trả về kh hiện field password
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        // this only works on CREATE and SAVE!!
        validator: function (el) {
          return this.password === el;
        },
        message: "Password are not the same",
      },
    },
    // recently_viewed: [{ type: mongoose.Schema.Types.ObjectId, ref: Book }],
    date_of_birth: Date,
    address: [Object],
    suggestion: [{ deleteLink: String, url: String }],
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    phoneNumber: { type: String, default: "" },
    gender: { type: Number, enum: [1, 2, 3] },
    following: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (this.isModified("firstName") || this.isModified("lastName")) {
    this.fullName = this.firstName + " " + this.lastName;
    this.firstName = undefined;
    this.lastName = undefined;
  }
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// userSchema.pre(/^find/, function (next) {
//   this.find({
//     active: {
//       $ne: false,
//     },
//   });
//   next();
// });

// userSchema.post('find', async function (docs) {
//   for (const item of docs) {
//     // if (item.role !== 'admin') {
//     //   await Cart.create({ user: item._id, cartItems: [] })
//     // }
//     // console.log(pub1)
//   }
//   // console.log(this)
// })

// userSchema.methods.correctPassword = async function (
//   password,
//   candidatePassword
// ) {
//   return bcrypt.compareSync(password, candidatePassword);
// };

module.exports = mongoose.model(DOCUMENT_NAME, userSchema);
