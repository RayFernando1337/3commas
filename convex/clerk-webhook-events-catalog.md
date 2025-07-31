
# paymentAttempt.created

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "billing_date": 42,
    "charge_type": "some string",
    "created_at": 42,
    "failed_at": 42,
    "failed_reason": {
      "code": "some string",
      "decline_code": "some string"
    },
    "gateway_external_id": "some string",
    "id": "some string",
    "instance_id": "some string",
    "paid_at": 42,
    "payee": {
      "gateway_external_id": "some string",
      "gateway_status": "some string",
      "gateway_type": "some string",
      "id": "some string"
    },
    "payer": {
      "email": "some string",
      "first_name": "some string",
      "id": "some string",
      "image_url": "some string",
      "last_name": "some string",
      "organization_id": "some string",
      "organization_name": "some string",
      "user_id": "some string"
    },
    "payment_id": "some string",
    "payment_source": {
      "card_type": "some string",
      "gateway": "some string",
      "gateway_external_account_id": "some string",
      "gateway_external_id": "some string",
      "id": "some string",
      "last4": "some string",
      "payment_method": "some string",
      "status": "some string"
    },
    "statement_id": "some string",
    "status": "some string",
    "subscription_items": [
      {
        "amount": {
          "amount": 42,
          "amount_formatted": "some string",
          "currency": "some string",
          "currency_symbol": "some string"
        },
        "canceled_at": 42,
        "credit": {
          "amount": {
            "amount": 42,
            "amount_formatted": "some string",
            "currency": "some string",
            "currency_symbol": "some string"
          },
          "cycle_days_remaining": 42,
          "cycle_days_total": 42,
          "cycle_remaining_percent": 3.14
        },
        "id": "some string",
        "lifetime_paid": 42,
        "next_payment_amount": 42,
        "next_payment_date": 42,
        "past_due_at": 42,
        "period_end": 42,
        "period_start": 42,
        "plan": {
          "amount": 42,
          "annual_monthly_amount": 42,
          "currency": "some string",
          "description": "some string",
          "has_base_fee": true,
          "id": "some string",
          "instance_id": "some string",
          "interval": 42,
          "is_default": true,
          "is_prorated": true,
          "is_recurring": true,
          "name": "some string",
          "period": "some string",
          "product_id": "some string",
          "publicly_visible": true,
          "slug": "some string"
        },
        "plan_id": "some string",
        "plan_period": "some string",
        "proration_date": "some string",
        "status": "some string"
      }
    ],
    "totals": {
      "grand_total": {
        "amount": 42,
        "amount_formatted": "some string",
        "currency": "some string",
        "currency_symbol": "some string"
      },
      "subtotal": {
        "amount": 42,
        "amount_formatted": "some string",
        "currency": "some string",
        "currency_symbol": "some string"
      },
      "tax_total": {
        "amount": 42,
        "amount_formatted": "some string",
        "currency": "some string",
        "currency_symbol": "some string"
      }
    },
    "updated_at": 42
  }
}

# paymentAttempt.updated

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "billing_date": 42,
    "charge_type": "some string",
    "created_at": 42,
    "failed_at": 42,
    "failed_reason": {
      "code": "some string",
      "decline_code": "some string"
    },
    "gateway_external_id": "some string",
    "id": "some string",
    "instance_id": "some string",
    "paid_at": 42,
    "payee": {
      "gateway_external_id": "some string",
      "gateway_status": "some string",
      "gateway_type": "some string",
      "id": "some string"
    },
    "payer": {
      "email": "some string",
      "first_name": "some string",
      "id": "some string",
      "image_url": "some string",
      "last_name": "some string",
      "organization_id": "some string",
      "organization_name": "some string",
      "user_id": "some string"
    },
    "payment_id": "some string",
    "payment_source": {
      "card_type": "some string",
      "gateway": "some string",
      "gateway_external_account_id": "some string",
      "gateway_external_id": "some string",
      "id": "some string",
      "last4": "some string",
      "payment_method": "some string",
      "status": "some string"
    },
    "statement_id": "some string",
    "status": "some string",
    "subscription_items": [
      {
        "amount": {
          "amount": 42,
          "amount_formatted": "some string",
          "currency": "some string",
          "currency_symbol": "some string"
        },
        "canceled_at": 42,
        "credit": {
          "amount": {
            "amount": 42,
            "amount_formatted": "some string",
            "currency": "some string",
            "currency_symbol": "some string"
          },
          "cycle_days_remaining": 42,
          "cycle_days_total": 42,
          "cycle_remaining_percent": 3.14
        },
        "id": "some string",
        "lifetime_paid": 42,
        "next_payment_amount": 42,
        "next_payment_date": 42,
        "past_due_at": 42,
        "period_end": 42,
        "period_start": 42,
        "plan": {
          "amount": 42,
          "annual_monthly_amount": 42,
          "currency": "some string",
          "description": "some string",
          "has_base_fee": true,
          "id": "some string",
          "instance_id": "some string",
          "interval": 42,
          "is_default": true,
          "is_prorated": true,
          "is_recurring": true,
          "name": "some string",
          "period": "some string",
          "product_id": "some string",
          "publicly_visible": true,
          "slug": "some string"
        },
        "plan_id": "some string",
        "plan_period": "some string",
        "proration_date": "some string",
        "status": "some string"
      }
    ],
    "totals": {
      "grand_total": {
        "amount": 42,
        "amount_formatted": "some string",
        "currency": "some string",
        "currency_symbol": "some string"
      },
      "subtotal": {
        "amount": 42,
        "amount_formatted": "some string",
        "currency": "some string",
        "currency_symbol": "some string"
      },
      "tax_total": {
        "amount": 42,
        "amount_formatted": "some string",
        "currency": "some string",
        "currency_symbol": "some string"
      }
    },
    "updated_at": 42
  }
}

# subscription.active

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "active_at": 42,
    "canceled_at": 42,
    "created_at": 42,
    "ended_at": 42,
    "id": "some string",
    "items": [
      {
        "created_at": 42,
        "id": "some string",
        "interval": "some string",
        "object": "some string",
        "period_end": 42,
        "period_start": 42,
        "plan": {
          "amount": 42,
          "currency": "some string",
          "id": "some string",
          "is_default": true,
          "is_recurring": true,
          "name": "some string",
          "slug": "some string"
        },
        "plan_id": "some string",
        "status": "some string",
        "subscription_id": "some string",
        "updated_at": 42
      }
    ],
    "latest_payment_id": "some string",
    "object": "some string",
    "past_due_at": 42,
    "payer_id": "some string",
    "payment_source_id": "some string",
    "status": "some string",
    "updated_at": 42
  }
}

# subscription.created

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "active_at": 42,
    "canceled_at": 42,
    "created_at": 42,
    "ended_at": 42,
    "id": "some string",
    "items": [
      {
        "created_at": 42,
        "id": "some string",
        "interval": "some string",
        "object": "some string",
        "period_end": 42,
        "period_start": 42,
        "plan": {
          "amount": 42,
          "currency": "some string",
          "id": "some string",
          "is_default": true,
          "is_recurring": true,
          "name": "some string",
          "slug": "some string"
        },
        "plan_id": "some string",
        "status": "some string",
        "subscription_id": "some string",
        "updated_at": 42
      }
    ],
    "latest_payment_id": "some string",
    "object": "some string",
    "past_due_at": 42,
    "payer_id": "some string",
    "payment_source_id": "some string",
    "status": "some string",
    "updated_at": 42
  }
}

# subscription.past_due

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "active_at": 42,
    "canceled_at": 42,
    "created_at": 42,
    "ended_at": 42,
    "id": "some string",
    "items": [
      {
        "created_at": 42,
        "id": "some string",
        "interval": "some string",
        "object": "some string",
        "period_end": 42,
        "period_start": 42,
        "plan": {
          "amount": 42,
          "currency": "some string",
          "id": "some string",
          "is_default": true,
          "is_recurring": true,
          "name": "some string",
          "slug": "some string"
        },
        "plan_id": "some string",
        "status": "some string",
        "subscription_id": "some string",
        "updated_at": 42
      }
    ],
    "latest_payment_id": "some string",
    "object": "some string",
    "past_due_at": 42,
    "payer_id": "some string",
    "payment_source_id": "some string",
    "status": "some string",
    "updated_at": 42
  }
}

# subscription.updated

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "active_at": 42,
    "canceled_at": 42,
    "created_at": 42,
    "ended_at": 42,
    "id": "some string",
    "items": [
      {
        "created_at": 42,
        "id": "some string",
        "interval": "some string",
        "object": "some string",
        "period_end": 42,
        "period_start": 42,
        "plan": {
          "amount": 42,
          "currency": "some string",
          "id": "some string",
          "is_default": true,
          "is_recurring": true,
          "name": "some string",
          "slug": "some string"
        },
        "plan_id": "some string",
        "status": "some string",
        "subscription_id": "some string",
        "updated_at": 42
      }
    ],
    "latest_payment_id": "some string",
    "object": "some string",
    "past_due_at": 42,
    "payer_id": "some string",
    "payment_source_id": "some string",
    "status": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.abandoned

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.active

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.canceled

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.created

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.ended

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.incomplete

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.past_due

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.upcoming

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# subscriptionItem.updated

{
  "event_attributes": {
    "http_request": {
      "client_ip": "some string",
      "user_agent": "some string"
    }
  },
  "instance_id": "some string",
  "object": "some string",
  "timestamp": 42,
  "type": "some string",
  "data": {
    "created_at": 42,
    "id": "some string",
    "interval": "some string",
    "object": "some string",
    "period_end": 42,
    "period_start": 42,
    "plan": {
      "amount": 42,
      "currency": "some string",
      "id": "some string",
      "is_default": true,
      "is_recurring": true,
      "name": "some string",
      "slug": "some string"
    },
    "plan_id": "some string",
    "status": "some string",
    "subscription_id": "some string",
    "updated_at": 42
  }
}

# user.created

{
  "data": {
    "birthday": "",
    "created_at": 1654012591514,
    "email_addresses": [
      {
        "email_address": "example@example.org",
        "id": "idn_29w83yL7CwVlJXylYLxcslromF1",
        "linked_to": [],
        "object": "email_address",
        "verification": {
          "status": "verified",
          "strategy": "ticket"
        }
      }
    ],
    "external_accounts": [],
    "external_id": "567772",
    "first_name": "Example",
    "gender": "",
    "id": "user_29w83sxmDNGwOuEthce5gg56FcC",
    "image_url": "https://img.clerk.com/xxxxxx",
    "last_name": "Example",
    "last_sign_in_at": 1654012591514,
    "object": "user",
    "password_enabled": true,
    "phone_numbers": [],
    "primary_email_address_id": "idn_29w83yL7CwVlJXylYLxcslromF1",
    "primary_phone_number_id": null,
    "primary_web3_wallet_id": null,
    "private_metadata": {},
    "profile_image_url": "https://www.gravatar.com/avatar?d=mp",
    "public_metadata": {},
    "two_factor_enabled": false,
    "unsafe_metadata": {},
    "updated_at": 1654012591835,
    "username": null,
    "web3_wallets": []
  },
  "event_attributes": {
    "http_request": {
      "client_ip": "0.0.0.0",
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
  },
  "object": "event",
  "timestamp": 1654012591835,
  "type": "user.created"
}

# user.deleted

{
  "data": {
    "deleted": true,
    "id": "user_29wBMCtzATuFJut8jO2VNTVekS4",
    "object": "user"
  },
  "event_attributes": {
    "http_request": {
      "client_ip": "0.0.0.0",
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
  },
  "object": "event",
  "timestamp": 1661861640000,
  "type": "user.deleted"
}

# user.updated

{
  "data": {
    "birthday": "",
    "created_at": 1654012591514,
    "email_addresses": [
      {
        "email_address": "example@example.org",
        "id": "idn_29w83yL7CwVlJXylYLxcslromF1",
        "linked_to": [],
        "object": "email_address",
        "reserved": true,
        "verification": {
          "attempts": null,
          "expire_at": null,
          "status": "verified",
          "strategy": "admin"
        }
      }
    ],
    "external_accounts": [],
    "external_id": null,
    "first_name": "Example",
    "gender": "",
    "id": "user_29w83sxmDNGwOuEthce5gg56FcC",
    "image_url": "https://img.clerk.com/xxxxxx",
    "last_name": null,
    "last_sign_in_at": null,
    "object": "user",
    "password_enabled": true,
    "phone_numbers": [],
    "primary_email_address_id": "idn_29w83yL7CwVlJXylYLxcslromF1",
    "primary_phone_number_id": null,
    "primary_web3_wallet_id": null,
    "private_metadata": {},
    "profile_image_url": "https://www.gravatar.com/avatar?d=mp",
    "public_metadata": {},
    "two_factor_enabled": false,
    "unsafe_metadata": {},
    "updated_at": 1654012824306,
    "username": null,
    "web3_wallets": []
  },
  "event_attributes": {
    "http_request": {
      "client_ip": "0.0.0.0",
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
  },
  "object": "event",
  "timestamp": 1654012824306,
  "type": "user.updated"
}




