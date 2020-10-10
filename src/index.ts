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
    finishListeners = [] as ((failedReceivers: string[]) => void)[];
    updateListeners = [] as ((progress: number) => void)[];
    cancelListeners = [] as ((receiverList: string[]) => void)[];
    
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

        const numberOfReceivers = receiverList.length;

        for(let i = 0; i < numberOfReceivers; i++) {
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

            this.update(i + 1);
            
            await SimpleMailing.timeout(timeoutTime);
        }

        this.mailingFinished(failedReceivers);
    }


    addEventlistener(event: Events, fn: () => void) {
        switch (event) {
            case Events.FINISH:
                this.finishListeners.push(fn);
                break;
            case Events.UPDATE:
                this.updateListeners.push(fn);
                break;
            case Events.CANCEL:
                this.cancelListeners.push(fn);
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
        this.finish(failedReceivers);
    }

    private mailingCancelled(receiverList: string[]) {
        this.isRunning = false;
        this.cancel(receiverList);
    }

    private update(progress: number) {
        this.updateListeners.forEach(l => l(progress));
    }

    private cancel(receiverList: string[]) {
        this.cancelListeners.forEach(l => l(receiverList));
    }

    private finish(failedReceivers: string[]) {
        this.finishListeners.forEach(l => l(failedReceivers))
    }
}
