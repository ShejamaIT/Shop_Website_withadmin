import User from "../models/User.js";

// create new user
export const createUser = async (req,res)=>{

    const newUser = new User(req.body)
    try {
        const savedUser = await newUser.save()

        res.status(200).json({success:true,message:'Successfully created..',data:savedUser})
    }catch (err){
        res.status(500).json({success:false,message:'Not Created..'})

    }
};


//update user
export const updateUser = async (req,res) =>{

    const id = req.params.id

    try{

        const updatedUser = await User.findByIdAndUpdate(id,{
            $set: req.body
        },{new:true})

        res.status(200).json({success:true,message:'Successfully updated..',data:updateUser});
    }catch (err){
        res.status(500).json({success:false,message:'failed to update..'})
    }
};



//delete user
export const deleteUser = async (req,res) =>{
    const id = req.params.id
    console.log(id);
    try{

        await User.findByIdAndDelete(id);

        res.status(200).json({success:true,message:'Successfully deleted..'});
    }catch (err){
        res.status(500).json({success:false,message:'failed to delete..'})
    }
};




//getSingle user
export const getSingleUser = async (req,res) =>{
    const id = req.params.id

    try{

        const user = await User.findById(id);

        res.status(200).json({success:true,message:'Successfully Found..', data:user});
    }catch (err){
        res.status(404).json({success:false,message:'Not Found..'})
    }
};



//getAll users
export const getAllUser = async (req, res) => {
    console.log(req.user); // Should print user information

    try {
        const users = await User.find({});
        res.status(200).json({ success: true, message: 'Successfully found.', data: users });
    } catch (err) {
        res.status(404).json({ success: false, message: 'Not Found.' });
    }
};

