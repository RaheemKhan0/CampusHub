import { Module } from "@nestjs/common";
import { NotificationContoller } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationPreferenceService } from "./notification-preference.service";


@Module({
controllers: [NotificationContoller],
providers : [
NotificationService,
NotificationPreferenceService,
],
exports : [NotificationService, NotificationPreferenceService],
})

export class NotificationsModule {}


