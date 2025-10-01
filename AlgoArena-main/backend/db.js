const mongoose = require('mongoose');

// Use a local MongoDB URI if no environment variable is set
const MONGO_URI = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/algoarena";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("connected to database"))
.catch(e => console.log("Some Error while connecting to Database:", e));

// --------------------- Schemas ---------------------
const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const CodeVersionSchema = mongoose.Schema({
    content: String,
    diff: String,
    timestamp: { type: Date, default: Date.now },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
});

const CRDTOperationSchema = mongoose.Schema({
    type: String,
    position: Number,
    content: String,
    timestamp: { type: Date, default: Date.now },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clock: {
        userId: String,
        counter: Number
    }
});

const RoomSchema = mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    code: { type: String, default: "// Start coding here!" },
    language: { type: String, required: true },
    versions: [CodeVersionSchema],
    operations: [CRDTOperationSchema],
    metadata: {
        lastModified: { type: Date, default: Date.now },
        lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        versionCount: { type: Number, default: 0 },
        size: Number,
        isLocked: { type: Boolean, default: false },
        lockHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    createdAt: { type: Date, default: Date.now },
});

// --------------------- Methods ---------------------
RoomSchema.methods.createVersion = async function(author, message) {
    const previousVersion = this.versions[this.versions.length - 1];
    const diff = previousVersion ?
        require('diff').createPatch('code', previousVersion.content, this.code) :
        this.code;

    this.versions.push({ content: this.code, diff, author, message });
    this.metadata.versionCount++;
    this.metadata.lastModified = Date.now();
    this.metadata.lastModifiedBy = author;
    return this.save();
};

RoomSchema.methods.applyOperation = async function(operation) {
    this.operations.push(operation);

    if (operation.type === 'insert') {
        const codeArray = this.code.split('');
        codeArray.splice(operation.position, 0, operation.content);
        this.code = codeArray.join('');
    } else if (operation.type === 'delete') {
        const codeArray = this.code.split('');
        codeArray.splice(operation.position, operation.content.length);
        this.code = codeArray.join('');
    }

    this.metadata.lastModified = Date.now();
    this.metadata.lastModifiedBy = operation.author;
    this.metadata.size = this.code.length;

    return this.save();
};

// --------------------- Indexes ---------------------
RoomSchema.index({ 'metadata.lastModified': -1 });
RoomSchema.index({ 'versions.timestamp': -1 });
RoomSchema.index({ 'operations.timestamp': -1 });

// --------------------- Models ---------------------
const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', RoomSchema);

module.exports = { User, Room };
