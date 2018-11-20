import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { BrMaskerIonicServices3 } from 'brmasker-ionic-3';
import { DatePipe } from '@angular/common';
import { HomePage } from '../pages/home/home';
import { HttpClientModule } from '@angular/common/http';
import { MyApp } from './app.component';
import { SOCKET_IO_CONFIG } from '../config/socket.io.config';
import { SocketIoModule } from 'ng-socket-io';
import { UtilsService } from '../services/utils/utils.service';
import { VendaService } from '../services/domain/venda.service';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    SocketIoModule.forRoot(SOCKET_IO_CONFIG)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    BrMaskerIonicServices3,
    DatePipe,
    SplashScreen,
    StatusBar,
    UtilsService,
    VendaService
  ]
})
export class AppModule { }
