const Problem = require('../models/problem');
const User = require('../models/users');

const queue = [];
const activeMatches = {};

const matchHandler = (io, socket) => {

    socket.on('join_queue', async (userData) => {
        const isAlreadyInQueue = queue.some(user => user.userId === userData.userId);
        if (isAlreadyInQueue) return;

        queue.push({
            socketId: socket.id,
            userId: userData.userId,
            username: userData.username
        });

        if (queue.length >= 2) {
            const player1 = queue.shift();
            const player2 = queue.shift();

            const roomId = `match_${player1.userId}_${player2.userId}`;

            try {
                const count = await Problem.countDocuments();
                if (count === 0) {
                    io.to(player1.socketId).to(player2.socketId).emit('error', { message: 'No problems found in DB' });
                    return;
                }

                const randomIndex = Math.floor(Math.random() * count);
                const randomProblem = await Problem.findOne().skip(randomIndex);

                activeMatches[roomId] = {
                    roomId,
                    problemId: randomProblem._id,
                    player1: { userId: player1.userId, socketId: player1.socketId, status: 'coding' },
                    player2: { userId: player2.userId, socketId: player2.socketId, status: 'coding' },
                    isMatch: true,
                    winner: null
                };

                io.to(player1.socketId).emit('match_init', { roomId, problemId: randomProblem._id });
                io.to(player2.socketId).emit('match_init', { roomId, problemId: randomProblem._id });

            } catch (err) {
                console.error(err);
            }
        }
    });

    socket.on('match_submit', async ({ roomId, userId }) => {
        console.log("🎯 BACKEND RECEIVED SUBMIT FOR ROOM:", roomId, "FROM USER:", userId);
        
        const currentMatch = activeMatches[roomId];
        
        if (currentMatch && !currentMatch.winner) {
            currentMatch.winner = userId; // Redux wali exact User ID lock karo
    
            try {
                // 🎯 DIRECT UPDATE: Jo frontend ne userId bheji hai, seedha uska score badhao
                if (userId && userId !== "guest") {
                    const updatedUser = await User.findByIdAndUpdate(
                        userId, 
                        { $inc: { contestScore: 10 } },
                        { new: true } // Taaki updated data return ho
                    );
                    console.log(`✅ Score successfully updated to: ${updatedUser?.contestScore}`);
                }
    
                // 📢 DONO PLAYERS KO ALERTS PUSH KARO
                io.to(currentMatch.player1.socketId).emit('match_over', {
                    winnerId: userId,
                    message: currentMatch.player1.userId === userId ? 'Victory! You solved it first!' : 'Defeat! Opponent solved it first!'
                });
    
                io.to(currentMatch.player2.socketId).emit('match_over', {
                    winnerId: userId,
                    message: currentMatch.player2.userId === userId ? 'Victory! You solved it first!' : 'Defeat! Opponent solved it first!'
                });
    
                // Clean Memory
                delete activeMatches[roomId];
    
            } catch (err) {
                console.error('❌ Error updating score in DB:', err);
            }
        }
    });

    socket.on('leave_queue', (userData) => {
        const index = queue.findIndex(user => user.userId === userData.userId);
        if (index !== -1) {
            queue.splice(index, 1);
        }
    });

    socket.on('disconnect', () => {
        const index = queue.findIndex(user => user.socketId === socket.id);
        if (index !== -1) {
            queue.splice(index, 1);
        }
    });
};

module.exports = { matchHandler, activeMatches };