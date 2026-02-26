const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/gym_management');

  // Get the SupportTicket model
  const models = require('./src/models');

  // Try creating directly with the model
  try {
    console.log('Direct Model.create test:');
    const result = await models.SupportTicket.create({
      user: new mongoose.Types.ObjectId(),
      title: 'Direct Test',
      message: 'Direct message',
      priority: 'medium',
      status: 'open',
    });
    console.log('Success:', result._id);
    await models.SupportTicket.findByIdAndDelete(result._id);
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Now try through the repo pattern
  try {
    console.log('\nThrough create(data, options):');
    const result2 = await models.SupportTicket.create(
      {
        user: new mongoose.Types.ObjectId(),
        title: 'Repo Test',
        message: 'Repo message',
        priority: 'medium',
        status: 'open',
      },
      {},
    );
    console.log('Success:', result2._id || result2);
  } catch (e) {
    console.log('Error:', e.message);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
