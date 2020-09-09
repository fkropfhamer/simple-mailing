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
    sendMail(senderName, senderEmail, receivers, subject, text, html) {
        return this.transporter.sendMail({
            from: `"${senderName} <${senderEmail}>`,
            to: receivers,
            subject,
            text,
            html
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
    sendMailing(senderName, senderEmail, receiverList, subject, text, html, timeoutTime = 0) {
        if (this.isRunning) {
            throw Error('Another Mailing is running at the moment');
        }

        this.isCancelled = false;
        this.isRunning = true;

        this.senderName = senderName;
        this.senderEmail = senderEmail;
        this.receiverList = receiverList;
        this.subject = subject;
        this.text = text;
        this.html = html;

        this.timeoutTime = timeoutTime;

        this.sendNext();
    }

    async sendNext() {  
        if (this.isCancelled) {
            this.mailingCancelled()

            return;
        }

        if (this.receiverList.length === 0) {
            this.mailingFinished();

            return;
        }

        const receiver = this.receiverList.pop();

        await this.sendMail(this.senderName, this.senderEmail, receiver, this.subject, this.text, this.html);

        await timeout(this.timeoutTime);

        this.sendNext();
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
