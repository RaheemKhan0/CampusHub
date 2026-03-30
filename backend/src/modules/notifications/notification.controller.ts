import { Controller, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@thallesp/nestjs-better-auth";


@Controller('/notifications')
@UseGuards(AuthGuard)
export class NotificationContoller {
  
}
