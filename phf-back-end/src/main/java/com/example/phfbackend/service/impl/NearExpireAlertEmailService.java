package com.example.phfbackend.service.impl;

import com.example.phfbackend.enities.Alert;
import com.example.phfbackend.enities.NearExpireAlert;
import com.example.phfbackend.service.AlertEmailService;

public class NearExpireAlertEmailService implements AlertEmailService {
    @Override
    public String createAlertMail() {
        return "Tra ve noi dung mail duoc tao tu nearAlert";
    }
}
