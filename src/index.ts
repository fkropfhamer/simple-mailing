import { createTransport, TransportOptions } from 'nodemailer';


export default class SimpleMailing {
    private transporter
    private isCancelled = false
    private isRunning = false
    
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


    sendMail(senderName: string, senderEmail:  string, receivers: string[], subject: string, text: string, html: string, attachments = []) {
        return this.transporter.sendMail({
            from: `"${senderName} <${senderEmail}>`,
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
            
            await SimpleMailing.timeout(timeoutTime);
        }

        this.mailingFinished();
    }


    private static timeout(ms: number): Promise<void> {
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
