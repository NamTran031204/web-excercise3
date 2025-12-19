const express = require("express"); 
const mongoose = require("mongoose"); 
const cors = require("cors"); 

const app = express(); 

app.use(cors()); 
app.use(express.json()); 

mongoose
    .connect("mongodb+srv://20225146:20225146@deploymongoose.mqmlgnm.mongodb.net/?appName=deploymongoose")
    .then(() => console.log("Connected to MongoDB")) 
    .catch((err) => console.error("MongoDB Error:", err)); 


const UserSchema = new mongoose.Schema({
    name: {  
        type: String,  
        required: [true, 'Tên không được để trống'], 
        minlength: [2, 'Tên phải có ít nhất 2 ký tự'] 
    }, 
    age: {  
        type: Number,  
        required: [true, 'Tuổi không được để trống'], 
        min: [0, 'Tuổi phải >= 0'] 
    }, 
    email: {  
        type: String,  
        required: [true, 'Email không được để trống'], 
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'] 
    }, 
    address: {  
        type: String  
    } 
});

const User = mongoose.model("User", UserSchema); 

app.get("/api/users", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";

        const filter = search 
            ? { 
                $or: [ 
                    { name: { $regex: search, $options: "i" } }, 
                    { email: { $regex: search, $options: "i" } }, 
                    { address: { $regex: search, $options: "i" } } 
                ] 
            } 
            : {}; 
        
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(filter).skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            page: page >= 0 ? page : 0,
            limit,
            total,
            totalPages,
            data: users
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    } 

}); 


app.post("/api/users", async (req, res) => {
    try {
        const {name, age, address, email} = req.body;

        const newUser = await User.create({name, age, address, email});

        res.status(201).json({
            message: "Tạo người dùng thành công",
            data: newUser
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}); 

app.put("/api/users/:id", async (req, res) => {
    try { 
        const { id } = req.params; 
        const { name, age, email, address } = req.body; 
        const updateData = {};
        if (name !== undefined && name !== null) updateData.name = name;
        if (age !== undefined && age !== null) updateData.age = age;
        if (email !== undefined && email !== null) updateData.email = email;
        if (address !== undefined && address !== null) updateData.address = address;

        const updatedUser = await User.findByIdAndUpdate( 
            id, 
            updateData, 
            { new: true, runValidators: true }
        ); 
        if (!updatedUser) { 
            return res.status(404).json({ error: "Không tìm thấy người dùng" }); 
        } 
        res.json({ 
            message: "Cập nhật người dùng thành công", 
            data: updatedUser 
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}); 

app.delete("/api/users/:id", async (req, res) => {
    try { 
        const { id } = req.params; 
        const deletedUser = await User.findByIdAndDelete(id); 
        if (!deletedUser) { 
            return res.status(404).json({ error: "Không tìm thấy người dùng" }); 
        } 
        res.json({ message: "Xóa người dùng thành công" }); 
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    } 
}); 

app.listen(3001, () => { 
console.log("Server running on http://localhost:3001"); 
}); 