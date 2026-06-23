const cron = require('node-cron');
const Incident = require('../models/Incident');

const startCronJobs = () => {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        console.log('⏰ Running SLA & Stagnation Checks...');

        try {
            const now = Date.now();
            const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
            const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

            // --- CHECK 1: OPEN > 2 HOURS (Needs HOD Assignment) ---
            const unassignedIncidents = await Incident.find({
                status: 'OPEN',
                createdAt: { $lt: twoHoursAgo },
                isEscalated: false // Only process if not already flagged
            });

            if (unassignedIncidents.length > 0) {
                console.log(`⚠️ Escalating ${unassignedIncidents.length} unassigned tickets to HOD.`);
                
                const idsToEscalate = unassignedIncidents.map(inc => inc._id);
                
                // Mark as Escalated and High Priority so HOD sees them first
                await Incident.updateMany(
                    { _id: { $in: idsToEscalate } },
                    { 
                        $set: { 
                            isEscalated: true,
                            priority: 'High'
                            // Optional: Add a system note if your schema supports it
                            // description: `[SLA BREACH] ${incident.description}` 
                        } 
                    }
                );
            }

            // --- CHECK 2: IN_PROGRESS > 2 DAYS (Needs Staff Reminder) ---
            // Find tickets working for > 2 days that haven't been updated recently
            const stagnantIncidents = await Incident.find({
                status: 'IN_PROGRESS',
                updatedAt: { $lt: twoDaysAgo } 
            });

            if (stagnantIncidents.length > 0) {
                console.log(`⏳ Sending reminders for ${stagnantIncidents.length} stagnant tickets.`);

                // For each stagnant ticket, add a "System Reminder" comment
                // (This assumes you added the 'comments' array to your model in the previous step)
                for (const incident of stagnantIncidents) {
                    incident.comments.push({
                        message: "⚠️ SYSTEM REMINDER: This task has been In-Progress for over 2 days. Please update status or request help.",
                        sender: incident.assignedTo, // Or generic system ID
                        createdAt: new Date()
                    });
                    
                    // Update 'updatedAt' so we don't spam them every 30 mins
                    // We only remind them once every 2 days effectively
                    await incident.save(); 
                }
            }

        } catch (error) {
            console.error('❌ Error in Cron Job:', error.message);
        }
    });
};

module.exports = startCronJobs;