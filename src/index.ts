import { createTransport, TransportOptions } from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');

export enum Events {
    UPDATE = 'update',
    FINISH = 'finish',
    CANCEL = 'cancel',
}

export default class SimpleMailing {
    private transporter
    private isCancelled = false
    private isRunning = false
    private onFinish = (failedReceivers: string[]) => {};
    private onUpdate = (progress: number) => {};
    private onCancel = (receiverList: string[]) => {};
    
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


    async sendMailing(senderName: string, senderEmail: string, receiverList: string[], subject: string, text: string, html: string, attachments: Mail.Attachment[] = [], timeoutTime = 0) {
        if (this.isRunning) {
            throw Error('Another Mailing is running at the moment');
        }

        this.isCancelled = false;
        this.isRunning = true;

        const failedReceivers = [];

        for(let i = 0; i < receiverList.length; i++) {
            if (this.isCancelled) {
                this.mailingCancelled(receiverList);
    
                break;
            }

            const receiver = receiverList.pop();
            if (!receiver) {
                continue
            }

            try {
                await this.sendMail(senderName, senderEmail, [receiver], subject, text, html, attachments);
            } catch (error) {
                failedReceivers.push(receiver);
            }

            this.onUpdate(i + 1);
            
            await SimpleMailing.timeout(timeoutTime);
        }

        this.mailingFinished(failedReceivers);
    }


    setEventlistener(event: Events, fn: () => void) {
        switch (event) {
            case Events.FINISH:
                this.onFinish = fn;
                break;
            case Events.UPDATE:
                this.onUpdate = fn;
                break;
            case Events.CANCEL:
                this.onCancel = fn;
                break;
        }
    }


    private static async timeout(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cancelMailing() {
        this.isCancelled = true;
    }
            
    private mailingFinished(failedReceivers: string[]) {
        this.isRunning = false;
        this.onFinish(failedReceivers);
    }

    private mailingCancelled(receiverList: string[]) {
        this.isRunning = false;
        this.onCancel(receiverList);
    }
}
