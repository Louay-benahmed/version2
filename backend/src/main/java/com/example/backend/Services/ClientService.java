package com.example.backend.Services;

import com.example.backend.Entity.Client;
import com.example.backend.Entity.ClientExcelData;
import com.example.backend.Entity.Supplier;
import com.example.backend.Repositories.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    private static final Logger log = LoggerFactory.getLogger(ClientService.class);

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public Optional<Client> getClientById(Integer id) {
        return clientRepository.findById(id);
    }

    public Client createClient(Client client) {
        return clientRepository.save(client);
    }

    public Client updateClient(Integer id, Client clientDetails) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setName(clientDetails.getName());
        client.setEmail(clientDetails.getEmail());
        client.setSupplier(clientDetails.getSupplier());
        client.setMatricule_fiscale(clientDetails.getMatricule_fiscale());
        client.setAdress(clientDetails.getAdress());
        client.setUniqueIdentifier(clientDetails.getUniqueIdentifier());

        return clientRepository.save(client);
    }
    @Transactional
    public void deleteClient(Integer id) {
        try {
            System.out.println("Attempting to delete client with ID: " + id);
            Optional<Client> optionalClient = clientRepository.findById(id);

            if (optionalClient.isPresent()) {
                Client client = optionalClient.get();
                System.out.println("Client found: " + client);

                Supplier supplier = client.getSupplier();
                if (supplier != null) {
                    supplier.getClients().remove(client);
                }

                clientRepository.deleteById(id);
                clientRepository.flush();
                System.out.println("✅ Client deleted successfully");
            } else {
                System.out.println("❌ Client not found with ID: " + id);
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error deleting client: " + e.getMessage());
            e.printStackTrace();
        }
    }


    public Client saveClient(Client client) {
        return clientRepository.save(client);
    }

    @Transactional
    public Client updateClientWithSynchronization(Client updatedClient, String originalName) {
        Client savedClient = clientRepository.save(updatedClient);

        Set<String> namesToUpdate = new HashSet<>();
        namesToUpdate.add(originalName);
        namesToUpdate.add(updatedClient.getName());

        for (String name : namesToUpdate) {
            List<Client> sameNameClients = clientRepository.findByName(name);

            for (Client client : sameNameClients) {
                if (!client.getId().equals(updatedClient.getId())) {
                    client.setEmail(updatedClient.getEmail());
                    client.setMatricule_fiscale(updatedClient.getMatricule_fiscale());
                    client.setAdress(updatedClient.getAdress());
                    client.setUniqueIdentifier(updatedClient.getUniqueIdentifier());
                    clientRepository.save(client);
                }
            }
        }

        return savedClient;
    }

    // ... existing repository and methods ...

    public Client updateClientExcelData(Integer clientId, ClientExcelData excelData) {
        return clientRepository.findById(clientId)
                .map(client -> {
                    client.setExcelData(excelData);
                    return clientRepository.save(client);
                })
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Client not found with id: " + clientId
                ));
    }

    public Client patchClientExcelData(Integer clientId, Map<String, Object> updates) {
        return clientRepository.findById(clientId)
                .map(client -> {
                    // Initialize excelData if null
                    if (client.getExcelData() == null) {
                        client.setExcelData(new ClientExcelData());
                    }

                    // Apply direct updates
                    applyFieldUpdates(client.getExcelData(), updates);

                    // Calculate all derived fields
                    calculateDerivedFields(client.getExcelData());

                    return clientRepository.save(client);
                })
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Client not found with id: " + clientId
                ));
    }

    private void applyFieldUpdates(ClientExcelData excelData, Map<String, Object> updates) {
        updates.forEach((key, value) -> {
            try {
                Field field = ClientExcelData.class.getDeclaredField(key);
                field.setAccessible(true);

                // Handle type conversion
                if (value instanceof Number number) {
                    if (field.getType() == Double.class) {
                        value = number.doubleValue();
                    } else if (field.getType() == Integer.class) {
                        value = number.intValue();
                    }
                }

                field.set(excelData, value);
            } catch (Exception e) {
                log.warn("Failed to update field {}: {}", key, e.getMessage());
            }
        });
    }

    private void calculateDerivedFields(ClientExcelData excelData) {
        try {
            // Initialize null fields to avoid NPE
            if (excelData.getJanStatus() == null) excelData.setJanStatus("No");
            if (excelData.getFebStatus() == null) excelData.setFebStatus("No");
            if (excelData.getMarStatus() == null) excelData.setMarStatus("No");
            // Initialize other quarters similarly...

            // Calculate payments
            if (excelData.getPoids() != null && excelData.getGlobalAmount() != null) {
                double X = excelData.getPoids() * excelData.getGlobalAmount();
                double annual = X / 100.0;
                excelData.setAnnualPayment(annual);
                excelData.setMonthlyPayment(annual / 12.0);
            }

            // Calculate quarterly counts
            excelData.setQ1BcCount(countActiveMonths(
                    excelData.getJanStatus(), excelData.getFebStatus(), excelData.getMarStatus()));
            excelData.setQ2BcCount(countActiveMonths(
                    excelData.getAprStatus(), excelData.getMayStatus(), excelData.getJunStatus()));
            excelData.setQ3BcCount(countActiveMonths(
                    excelData.getJulStatus(), excelData.getAugStatus(), excelData.getSepStatus()));
            excelData.setQ4BcCount(countActiveMonths(
                    excelData.getOctStatus(), excelData.getNovStatus(), excelData.getDecStatus()));

            // Calculate amounts
            if (excelData.getMonthlyPayment() != null) {
                excelData.setQ1Amount(excelData.getQ1BcCount() * excelData.getMonthlyPayment());
                excelData.setQ2Amount(excelData.getQ2BcCount() * excelData.getMonthlyPayment());
                excelData.setQ3Amount(excelData.getQ3BcCount() * excelData.getMonthlyPayment());
                excelData.setQ4Amount(excelData.getQ4BcCount() * excelData.getMonthlyPayment());
            }

            // Set payment statuses
            excelData.setQ1PaymentStatus(getPaymentStatus(excelData.getQ1BcCount()));
            excelData.setQ2PaymentStatus(getPaymentStatus(excelData.getQ2BcCount()));
            excelData.setQ3PaymentStatus(getPaymentStatus(excelData.getQ3BcCount()));
            excelData.setQ4PaymentStatus(getPaymentStatus(excelData.getQ4BcCount()));

        } catch (Exception e) {
            log.error("Error calculating derived fields", e);
        }
    }

    private int countActiveMonths(String... monthStatuses) {
        if (monthStatuses == null) return 0;
        return (int) Arrays.stream(monthStatuses)
                .filter(Objects::nonNull)
                .filter(status -> "Yes".equalsIgnoreCase(status))
                .count();
    }

    private String getPaymentStatus(Integer count) {
        if (count == null) return "Unpaid";
        if (count == 3) return "Completed";
        if (count > 0) return "Partial";
        return "Unpaid";
    }

}
