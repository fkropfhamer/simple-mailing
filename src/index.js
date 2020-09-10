const nodemailer = require('nodemailer');


class SimpleMailing {
    constructor(host, port, user, pass) {
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: false,
            auth: {
                user,
                pass
            }
        })

    }

    /**
     * 
     * @param {string} senderName 
     * @param {string} senderEmail 
     * @param {string[]} receivers 
     * @param {string} subject 
     * @param {string} text 
     * @param {string} html 
     */
    sendMail(senderName, senderEmail, receivers, subject, text, html, attachments = []) {
        return this.transporter.sendMail({
            from: `"${senderName} <${senderEmail}>`,
            to: receivers,
            subject,
            text,
            html,
            attachments,
        });
    }

    /**
     * 
     * @param {string} senderName 
     * @param {string} senderEmail 
     * @param {string[]} receiverList 
     * @param {string} subject 
     * @param {string} text 
     * @param {string} html 
     * @param {number} timeoutTime
     */
    async sendMailing(senderName, senderEmail, receiverList, subject, text, html, timeoutTime = 0) {
        if (this.isRunning) {
            throw Error('Another Mailing is running at the moment');
        }

        this.isCancelled = false;
        this.isRunning = true;

        timeoutTime = timeoutTime;

        this.failedReceivers = [];

        for(let i = 0; i < receiverList.length; i++) {
            if (this.isCancelled) {
                this.mailingCancelled()
    
                break;
            }

            const receiver = this.receiverList.pop();

            try {
                await this.sendMail(senderName, senderEmail, receiver, subject, text, html);    
            } catch (error) {
                this.failedReceivers.push(receiver);
            }
            
            await timeout(this.timeoutTime);
        }

        this.mailingFinished();
    }

    /**
     * 
     * @param {number} ms 
     */
    static timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cancelMailing() {
        this.isCancelled = true;
    }
            
    mailingFinished() {
        this.isRunning = false;
    }

    mailingCancelled() {
        this.isRunning = false;
    }
}

module.export = SimpleMailing;
