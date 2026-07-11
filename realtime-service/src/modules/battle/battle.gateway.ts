import { Injectable } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
@WebSocketGateway({
  cors: "*",
  namespace: "ns-1"
})
export class BattleGateway {
  @SubscribeMessage("msg_1")
  doSomeEvent(){
    
  }
}