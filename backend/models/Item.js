import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
    {
        productName:{
            type:String,
            required:true,
            unique:true,
        },
        category:{
            type: String,
            required: true
        },
        price:{
            type: String,
            required:true
        },
        shortDesc:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        imgUrl:{
            type:String
        }
    },
    {timestamps : true}
);

export default mongoose.model("Item", itemSchema);
