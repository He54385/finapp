package com.finance.manager.controller;

import com.finance.manager.entity.Budget;
import com.finance.manager.entity.SavingsGoal;
import com.finance.manager.entity.Transaction;
import com.finance.manager.repository.BudgetRepository;
import com.finance.manager.repository.SavingsGoalRepository;
import com.finance.manager.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FinanceController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BudgetRepository budgetRepository;
    
    @Autowired
    private SavingsGoalRepository savingsGoalRepository;

    // --- Transactions ---

    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions(@RequestHeader("User-Id") Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    @PostMapping("/transactions")
    public Transaction addTransaction(@RequestHeader("User-Id") Long userId, @RequestBody Transaction transaction) {
        transaction.setUserId(userId);
        return transactionRepository.save(transaction);
    }

    @DeleteMapping("/transactions/{id}")
    public void deleteTransaction(@PathVariable Long id) {
        transactionRepository.deleteById(id);
    }

    // --- Budgets ---

    @GetMapping("/budgets")
    public List<Budget> getAllBudgets(@RequestHeader("User-Id") Long userId) {
        return budgetRepository.findByUserId(userId);
    }

    @PostMapping("/budgets")
    public Budget addBudget(@RequestHeader("User-Id") Long userId, @RequestBody Budget budget) {
        budget.setUserId(userId);
        return budgetRepository.save(budget);
    }

    @DeleteMapping("/budgets/{id}")
    public void deleteBudget(@PathVariable Long id) {
        budgetRepository.deleteById(id);
    }
    
    // --- Savings Goals ---
    
    @GetMapping("/savings")
    public List<SavingsGoal> getAllSavingsGoals(@RequestHeader("User-Id") Long userId) {
        return savingsGoalRepository.findByUserId(userId);
    }

    @PostMapping("/savings")
    public SavingsGoal addSavingsGoal(@RequestHeader("User-Id") Long userId, @RequestBody SavingsGoal goal) {
        goal.setUserId(userId);
        return savingsGoalRepository.save(goal);
    }

    @DeleteMapping("/savings/{id}")
    public void deleteSavingsGoal(@PathVariable Long id) {
        savingsGoalRepository.deleteById(id);
    }
    
    @PutMapping("/savings/{id}/add")
    public SavingsGoal addAmountToSavings(@PathVariable Long id, @RequestBody Map<String, BigDecimal> payload) {
        SavingsGoal goal = savingsGoalRepository.findById(id).orElseThrow();
        BigDecimal current = goal.getSavedAmount() != null ? goal.getSavedAmount() : BigDecimal.ZERO;
        goal.setSavedAmount(current.add(payload.get("amount")));
        return savingsGoalRepository.save(goal);
    }

    // --- Summary ---

    @GetMapping("/summary")
    public Map<String, Object> getSummary(@RequestHeader("User-Id") Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserId(userId);
        
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        
        for (Transaction t : transactions) {
            if ("INCOME".equalsIgnoreCase(t.getType()) && t.getAmount() != null) {
                totalIncome = totalIncome.add(t.getAmount());
            } else if ("EXPENSE".equalsIgnoreCase(t.getType()) && t.getAmount() != null) {
                totalExpense = totalExpense.add(t.getAmount());
            }
        }
        
        BigDecimal savings = totalIncome.subtract(totalExpense);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalIncome", totalIncome);
        summary.put("totalExpense", totalExpense);
        summary.put("savings", savings);
        
        return summary;
    }
}
