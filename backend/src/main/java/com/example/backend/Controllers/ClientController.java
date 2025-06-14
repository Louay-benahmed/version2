package com.example.backend.Controllers;

import com.example.backend.Entity.Client;
import com.example.backend.Entity.ClientExcelData;
import com.example.backend.Services.ClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.backend.Services.FileGenerationService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/clients")
public class ClientController {
    private static final Logger log = LoggerFactory.getLogger(ClientController.class);

    @Autowired
    private ClientService clientService;

    @Autowired
    private FileGenerationService fileGenerationService;

    @GetMapping
    public List<Client> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    public Client getClientById(@PathVariable Integer id) {
        return clientService.getClientById(id).orElseThrow(() -> new RuntimeException("Client not found"));
    }

    @PostMapping
    public Client createClient(@RequestBody Client client) {
        return clientService.createClient(client);
    }



    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable Integer id, @RequestBody Client clientDetails) {
        Client existingClient = clientService.getClientById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        String originalName = existingClient.getName();

        existingClient.setName(clientDetails.getName());
        existingClient.setEmail(clientDetails.getEmail());
        existingClient.setMatricule_fiscale(clientDetails.getMatricule_fiscale());
        existingClient.setAdress(clientDetails.getAdress());
        existingClient.setUniqueIdentifier(clientDetails.getUniqueIdentifier());

        Client updatedClient = clientService.updateClientWithSynchronization(existingClient, originalName);

        return ResponseEntity.ok(updatedClient);
    }

    @DeleteMapping("/{id}")
    public void deleteClient(@PathVariable Integer id) {
        clientService.deleteClient(id);
    }

    @GetMapping("/generate-pdf/{clientId}")
    public ResponseEntity<ByteArrayResource> generateClientPdf(
            @PathVariable int clientId,
            @RequestParam String moinsX,
            @RequestParam String moinsY,
            @RequestParam(name = "rs") double rsPercentage,  // Remove defaultValue
            @RequestParam(name = "tva") double tvaPercentage // Remove defaultValue
    ) throws Exception {

        log.info("Received params - RS: {}%, TVA: {}%", rsPercentage, tvaPercentage);

        Client client = clientService.getClientById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        byte[] pdfBytes = fileGenerationService.generateClientPdf(
                client, moinsX, moinsY, rsPercentage, tvaPercentage);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=client_" + client.getId() + "_invoice.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new ByteArrayResource(pdfBytes));
    }

    // 1. Get ClientExcelData for a specific client
    @GetMapping("/{clientId}/excel-data")
    public ResponseEntity<ClientExcelData> getClientExcelData(
            @PathVariable Integer clientId) {

        Client client = clientService.getClientById(clientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Client not found with id: " + clientId
                ));

        return Optional.ofNullable(client.getExcelData())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // 2. Full update of ClientExcelData
    @PutMapping("/{clientId}/excel-data/fullupdate")
    public ResponseEntity<Client> updateClientExcelData(
            @PathVariable Integer clientId,
            @RequestBody ClientExcelData excelData) {

        Client updatedClient = clientService.updateClientExcelData(clientId, excelData);
        return ResponseEntity.ok(updatedClient);
    }

    // 3. Partial update of ClientExcelData
    @PatchMapping("/{clientId}/excel-data")
    public ResponseEntity<Client> patchClientExcelData(
            @PathVariable Integer clientId,
            @RequestBody Map<String, Object> updates) {

        Client updatedClient = clientService.patchClientExcelData(clientId, updates);
        return ResponseEntity.ok(updatedClient);
    }
}