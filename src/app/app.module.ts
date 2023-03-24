import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActiveReportsModule } from '@grapecity/activereports-angular';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    ActiveReportsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
