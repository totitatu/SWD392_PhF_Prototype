package com.example.phfbackend.service;

import com.example.phfbackend.enities.Alert;

public interface AlertEmailService {

    Alert createAlert();
    default void sendAlert(){
        Alert alert = createAlert();
        //Code goi SendGrid
    };

}
