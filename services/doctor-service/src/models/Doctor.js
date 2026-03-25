import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    userId: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },

    fullName: { type: String, 
        required: true 
    },

    phone: { 
        type: String, 
        default: "" 
    },

    specialization: { 
        type: String, 
        required: true, 
        index: true 
    },
    registrationNo: { 
        type: String, 
        required: true 
    },

    experienceYears: { 
        type: Number, 
        default: 0 
    },
    fee: { type: Number, 
        default: 0 
    },
    bio: { type: String, 
        default: "" 
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", DoctorSchema);