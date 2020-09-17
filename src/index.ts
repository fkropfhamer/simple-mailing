import { createTransport, TransportOptions } from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');

export enum Events {
    UPDATE = 'update',
    FINISH = 'finish',
}

export default class SimpleMailing {
    private transporter
    private isCancelled = false
    private isRunning = false
    private onFinish = () => {};
    private onUpdate = () => {};
    
    constructor(host: string, port: string, user: string, pass: string) {
        this.transporter = createTransport({
            host,
            port,
            secure: false,
            auth: {
                user,
                pass
            }
        } as TransportOptions)

    }


    sendMail(senderName: string, senderEmail:  string, receivers: string[], subject: string, text: string, html: string, attachments: Mail.Attachment[] = []) {
        return this.transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: receivers,
            subject,
            text,
            html,
            attachments,
        });
    }


    async sendMailing(senderName: string, senderEmail: string, receiverList: string[], subject: string, text: string, html: string, timeoutTime = 0) {
        if (this.isRunning) {
            throw Error('Another Mailing is running at the moment');
        }

        this.isCancelled = false;
        this.isRunning = true;

        timeoutTime = timeoutTime;

        const failedReceivers = [];

        for(let i = 0; i < receiverList.length; i++) {
            if (this.isCancelled) {
                this.mailingCancelled()
    
                break;
            }

            const receiver = receiverList.pop();
            if (!receiver) {
                continue
            }

            try {
                await this.sendMail(senderName, senderEmail, [receiver], subject, text, html);
            } catch (error) {
                failedReceivers.push(receiver);
            }

            this.onUpdate();
            
            await SimpleMailing.timeout(timeoutTime);
        }

        this.mailingFinished();
    }


    setEventlistener(event: Events, fn: () => void) {
        switch (event) {
            case Events.FINISH:
                this.onFinish = fn;
                break;
            case Events.UPDATE:
                this.onUpdate = fn;
                break;
        }
    }


    private static async timeout(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cancelMailing() {
        this.isCancelled = true;
    }
            
    private mailingFinished() {
        this.isRunning = false;
        this.onFinish();
    }

    private mailingCancelled() {
        this.isRunning = false;
    }
}
