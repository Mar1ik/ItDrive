package ru.itmo.itdrive.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class StatisticsRepository {
    
    @PersistenceContext
    private EntityManager entityManager;

    public TripStatisticsResult getTripStatistics(LocalDate startDate, LocalDate endDate) {
        Query query = entityManager.createNativeQuery(
                "SELECT * FROM get_trip_statistics(?1, ?2)"
        );
        query.setParameter(1, startDate);
        query.setParameter(2, endDate);
        
        Object[] result = (Object[]) query.getSingleResult();
        
        return new TripStatisticsResult() {
            @Override
            public Long getTotalTrips() {
                return ((Number) result[0]).longValue();
            }

            @Override
            public Long getCompletedTrips() {
                return ((Number) result[1]).longValue();
            }

            @Override
            public Long getTotalPassengers() {
                return ((Number) result[2]).longValue();
            }

            @Override
            public BigDecimal getTotalRevenue() {
                return (BigDecimal) result[3];
            }
        };
    }

    @SuppressWarnings("unchecked")
    public List<PopularRouteResult> getPopularRoutes(Integer limit) {
        Query query = entityManager.createNativeQuery(
                "SELECT * FROM get_popular_routes(?1)"
        );
        query.setParameter(1, limit != null ? limit : 10);
        
        List<Object[]> results = query.getResultList();
        List<PopularRouteResult> routes = new ArrayList<>();
        
        for (Object[] row : results) {
            routes.add(new PopularRouteResult() {
                @Override
                public String getFromBuildingName() {
                    return (String) row[0];
                }

                @Override
                public String getToBuildingName() {
                    return (String) row[1];
                }

                @Override
                public Long getTripCount() {
                    return ((Number) row[2]).longValue();
                }
            });
        }
        
        return routes;
    }
    
    public interface TripStatisticsResult {
        Long getTotalTrips();
        Long getCompletedTrips();
        Long getTotalPassengers();
        BigDecimal getTotalRevenue();
    }
    
    public interface PopularRouteResult {
        String getFromBuildingName();
        String getToBuildingName();
        Long getTripCount();
    }
}
