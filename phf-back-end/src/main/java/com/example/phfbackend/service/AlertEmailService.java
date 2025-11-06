package com.example.phfbackend.service;

import com.example.phfbackend.enities.Alert;

public interface AlertEmailService {

    String createAlertMail();
    default void sendAlert(){
        String Mail = createAlertMail();
        //Code goi SendGrid
    };

}
