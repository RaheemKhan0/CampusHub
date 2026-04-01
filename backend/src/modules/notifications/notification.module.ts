import { Module } from "@nestjs/common";
import { NotificationContoller } from "./notification.controller";
import { NotificationService } from "./notification.service";


@Module({
controllers: [NotificationContoller],
providers : [
NotificationService,
],
exports : [NotificationService],
})

export class NotificationsModule {}


