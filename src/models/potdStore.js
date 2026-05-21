const mongoose = require('mongoose');

const potdStoreSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'problem', // Jo bhi tera main Problem model ka naam hai
        required: true
    },
    dateString: {
        type: String, // Format: "YYYY-MM-DD" taaki unique check lag sake
        required: true,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('PotdStore', potdStoreSchema);