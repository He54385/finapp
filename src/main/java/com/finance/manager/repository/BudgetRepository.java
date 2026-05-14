package com.finance.manager.repository;

import com.finance.manager.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByMonthYear(String monthYear);
}
