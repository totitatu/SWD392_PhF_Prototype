package com.example.phfbackend.entities.supplier;

import com.example.phfbackend.entities.shared.Validation;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Contact details embedded within supplier entities.
 */
@Embeddable
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(builderMethodName = "newBuilder")
public class ContactInfo {

    @Column(name = "contact_name", nullable = false, length = 128)
    private String name;

    @Column(name = "contact_email", nullable = false, length = 128)
    private String email;

    @Column(name = "contact_phone", length = 64)
    private String phone;

    @Column(name = "contact_address", length = 255)
    private String address;

    public static ContactInfo of(String name, String email, String phone, String address) {
        ContactInfo info = new ContactInfo();
        info.update(name, email, phone, address);
        return info;
    }

    public void update(String name, String email, String phone, String address) {
        this.name = Validation.requireNonBlank(name, "contact.name");
        this.email = Validation.requireNonBlank(email, "contact.email");
        this.phone = phone;
        this.address = address;
    }
}
