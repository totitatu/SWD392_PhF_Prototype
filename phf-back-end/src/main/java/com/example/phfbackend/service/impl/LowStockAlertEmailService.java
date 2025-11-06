package com.example.phfbackend.service.impl;

import com.example.phfbackend.enities.Alert;
import com.example.phfbackend.enities.LowStockAlert;
import com.example.phfbackend.service.AlertEmailService;

public class LowStockAlertEmailService implements AlertEmailService {
    @Override
    public Alert createAlert() {
        return new LowStockAlert();
    }
}
