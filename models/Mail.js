const mongoose = require('mongoose');


const mailSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'pending', 'cancelled'],
        default: 'pending'
    },
    content: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now,
        required: false
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
})

mailSchema.pre('save', async function (next) {
    if (this.isModified('status')) {
        if (!this.user || !this.order) {
            return next(); // hoppa över template-logik om något saknas
        }

        try {
            const user = await mongoose.model('User').findById(this.user);
            const order = await mongoose.model('Order').findById(this.order);

            if (!user || !order) {
                return next(); // Hoppa över om user/order inte hittas (t.ex. i test setup)
            }

            switch (this.status) {
                case 'pending':
                    this.subject = `Hej ${user.name}, din beställning väntar på bekräftelse`;
                    this.content = `Hej ${user.name}, vi har tagit emot din beställning med ordernummer ${order._id}. Din beställning är under behandling.`;
                    this.sentAt = null;
                    break;
                case 'sent':
                    this.subject = `Hej ${user.name}, din beställning är skickad`;
                    this.content = `Hej ${user.name}, vi har tagit emot din beställning med ordernummer ${order._id}. Din beställning är bekräftad.`;
                    this.sentAt = Date.now();
                    break;
                case 'cancelled':
                    this.subject = `Hej ${user.name}, din beställning är avbruten`;
                    this.content = `Hej ${user.name}, vi har avbrutit beställning ${order._id}.`;
                    this.sentAt = null;
                    break;
            }
        } catch (err) {
            return next(err);
        }
    }

    next();
});



const Mail = mongoose.model('Mail', mailSchema);

module.exports = Mail;