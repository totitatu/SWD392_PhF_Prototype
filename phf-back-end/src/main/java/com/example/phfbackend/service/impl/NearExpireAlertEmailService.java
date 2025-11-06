package com.example.phfbackend.service.impl;

import com.example.phfbackend.enities.Alert;
import com.example.phfbackend.enities.NearExpireAlert;
import com.example.phfbackend.service.AlertEmailService;

public class NearExpireAlertEmailService implements AlertEmailService {
    @Override
    public Alert createAlert() {
        return new NearExpireAlert();
    }
}
